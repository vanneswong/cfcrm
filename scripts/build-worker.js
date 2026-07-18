const fs = require('fs');
const path = require('path');

// 读取前端静态文件
const distDir = path.join(__dirname, '../packages/frontend/dist');
let indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
const jsFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.js'));

let jsContent = '';
for (const file of jsFiles) {
  jsContent += fs.readFileSync(path.join(distDir, 'assets', file), 'utf-8');
}

// 修改index.html，移除外部脚本引用
indexHtml = indexHtml.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/, '');

// 生成worker.js
const workerCode = `
// CRM Cloudflare Worker - 自包含版本
// 可直接在 Cloudflare Dashboard 中部署

// ============= 前端静态文件 =============
const INDEX_HTML = ${JSON.stringify(indexHtml)};
const APP_JS = ${JSON.stringify(jsContent)};

// ============= JWT 工具函数 =============
async function base64url(data) {
  const str = typeof data === 'string' ? data : String.fromCharCode(...new Uint8Array(data));
  return btoa(str).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

async function hmacSign(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64url(signature);
}

async function sign(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = await base64url(JSON.stringify(header));
  const payloadB64 = await base64url(JSON.stringify(payload));
  const signature = await hmacSign(headerB64 + '.' + payloadB64, secret);
  return headerB64 + '.' + payloadB64 + '.' + signature;
}

async function verify(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  
  const [headerB64, payloadB64, signature] = parts;
  const expectedSig = await hmacSign(headerB64 + '.' + payloadB64, secret);
  
  if (signature !== expectedSig) throw new Error('Invalid signature');
  
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }
  
  return payload;
}

// ============= 工具函数 =============
function generateId() {
  return crypto.randomUUID();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

function htmlResponse(html) {
  // 注入前端JS
  const injectedHtml = html.replace('</body>', '<script>' + APP_JS + '</script></body>');
  return new Response(injectedHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ============= 认证中间件 =============
async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.slice(7);
    const payload = await verify(token, env.JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ============= API 路由处理 =============
async function handleAPI(request, env, path) {
  const method = request.method;
  
  // OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
  
  // 健康检查
  if (path === '/health') {
    return jsonResponse({ status: 'ok', ts: new Date().toISOString() });
  }
  
  // 登录
  if (path === '/api/auth/login' && method === 'POST') {
    try {
      const { email, password } = await request.json();
      
      if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
        const token = await sign(
          { sub: 'admin-001', email: env.ADMIN_EMAIL, role: 'admin', name: env.ADMIN_NAME },
          env.JWT_SECRET
        );
        
        return jsonResponse({
          token,
          user: { id: 'admin-001', email: env.ADMIN_EMAIL, name: env.ADMIN_NAME, role: 'admin' }
        });
      }
      
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    } catch (err) {
      return jsonResponse({ error: 'Login failed', detail: err.message }, 500);
    }
  }
  
  // 以下路由需要认证
  const user = await authenticate(request, env);
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  // 获取当前用户
  if (path === '/api/me' && method === 'GET') {
    return jsonResponse(user);
  }
  
  // 客户列表
  if (path === '/api/customers' && method === 'GET') {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
      const offset = (page - 1) * perPage;
      
      const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM customers').first();
      const total = countResult.total;
      
      const listResult = await env.DB.prepare(
        'SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(perPage, offset).all();
      
      return jsonResponse({
        data: listResult.results,
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage)
      });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 客户详情
  const customerMatch = path.match(/^\\/api\\/customers\\/([^/]+)$/);
  if (customerMatch && method === 'GET') {
    try {
      const customer = await env.DB.prepare('SELECT * FROM customers WHERE id = ?')
        .bind(customerMatch[1]).first();
      
      if (!customer) return jsonResponse({ error: 'Not found' }, 404);
      return jsonResponse(customer);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 创建客户
  if (path === '/api/customers' && method === 'POST') {
    try {
      const body = await request.json();
      const id = generateId();
      
      await env.DB.prepare(
        'INSERT INTO customers (id, name, company, industry, status, source, email, phone, address, website, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, body.name, body.company || null, body.industry || null, body.status || 'lead',
        body.source || null, body.email || null, body.phone || null, body.address || null,
        body.website || null, body.notes || null, user.sub
      ).run();
      
      const customer = await env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
      return jsonResponse(customer, 201);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 更新客户
  if (customerMatch && method === 'PATCH') {
    try {
      const body = await request.json();
      const sets = [];
      const values = [];
      
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) {
          sets.push(key + ' = ?');
          values.push(value);
        }
      }
      
      if (sets.length === 0) return jsonResponse({ error: 'No fields to update' }, 400);
      
      sets.push("updated_at = datetime('now')");
      values.push(customerMatch[1]);
      
      await env.DB.prepare('UPDATE customers SET ' + sets.join(', ') + ' WHERE id = ?')
        .bind(...values).run();
      
      const customer = await env.DB.prepare('SELECT * FROM customers WHERE id = ?')
        .bind(customerMatch[1]).first();
      
      return jsonResponse(customer);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 删除客户
  if (customerMatch && method === 'DELETE') {
    try {
      await env.DB.prepare('DELETE FROM customers WHERE id = ?').bind(customerMatch[1]).run();
      return jsonResponse({ success: true });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 客户联系人
  const contactsMatch = path.match(/^\\/api\\/customers\\/([^/]+)\\/contacts$/);
  if (contactsMatch && method === 'GET') {
    try {
      const result = await env.DB.prepare(
        'SELECT * FROM contacts WHERE customer_id = ? ORDER BY is_primary DESC, created_at DESC'
      ).bind(contactsMatch[1]).all();
      
      return jsonResponse(result.results);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  if (contactsMatch && method === 'POST') {
    try {
      const body = await request.json();
      const id = generateId();
      
      await env.DB.prepare(
        'INSERT INTO contacts (id, customer_id, name, title, email, phone, department, is_primary, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, contactsMatch[1], body.name, body.title || null, body.email || null,
        body.phone || null, body.department || null, body.is_primary || 0, body.notes || null
      ).run();
      
      const contact = await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
      return jsonResponse(contact, 201);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 交易列表
  if (path === '/api/deals' && method === 'GET') {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
      const offset = (page - 1) * perPage;
      const stage = url.searchParams.get('stage');
      
      let whereClause = '';
      const params = [];
      
      if (stage) {
        whereClause = ' WHERE stage = ?';
        params.push(stage);
      }
      
      const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM deals' + whereClause)
        .bind(...params).first();
      const total = countResult.total;
      
      const listResult = await env.DB.prepare(
        'SELECT * FROM deals' + whereClause + ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(...params, perPage, offset).all();
      
      return jsonResponse({
        data: listResult.results,
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage)
      });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 交易详情
  const dealMatch = path.match(/^\\/api\\/deals\\/([^/]+)$/);
  if (dealMatch && method === 'GET') {
    try {
      const deal = await env.DB.prepare('SELECT * FROM deals WHERE id = ?')
        .bind(dealMatch[1]).first();
      
      if (!deal) return jsonResponse({ error: 'Not found' }, 404);
      return jsonResponse(deal);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 创建交易
  if (path === '/api/deals' && method === 'POST') {
    try {
      const body = await request.json();
      const id = generateId();
      
      await env.DB.prepare(
        'INSERT INTO deals (id, customer_id, title, amount, stage, probability, expected_close_date, contact_id, assigned_to, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, body.customer_id, body.title, body.amount, body.stage || 'qualification',
        body.probability || 20, body.expected_close_date || null, body.contact_id || null,
        body.assigned_to || null, body.notes || null, user.sub
      ).run();
      
      const deal = await env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
      return jsonResponse(deal, 201);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 客户沟通记录
  const interactionsMatch = path.match(/^\\/api\\/customers\\/([^/]+)\\/interactions$/);
  if (interactionsMatch && method === 'GET') {
    try {
      const result = await env.DB.prepare(
        'SELECT * FROM interactions WHERE customer_id = ? ORDER BY occurred_at DESC, created_at DESC'
      ).bind(interactionsMatch[1]).all();
      
      return jsonResponse(result.results);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 创建沟通记录
  if (path === '/api/interactions' && method === 'POST') {
    try {
      const body = await request.json();
      const id = generateId();
      
      await env.DB.prepare(
        'INSERT INTO interactions (id, customer_id, deal_id, type, subject, body, contact_id, occurred_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, body.customer_id, body.deal_id || null, body.type, body.subject,
        body.body || null, body.contact_id || null, body.occurred_at || null, user.sub
      ).run();
      
      const interaction = await env.DB.prepare('SELECT * FROM interactions WHERE id = ?')
        .bind(id).first();
      return jsonResponse(interaction, 201);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 标签列表
  if (path === '/api/tags' && method === 'GET') {
    try {
      const result = await env.DB.prepare('SELECT * FROM tags ORDER BY name').all();
      return jsonResponse(result.results);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  // 创建标签
  if (path === '/api/tags' && method === 'POST') {
    try {
      const body = await request.json();
      const id = generateId();
      
      await env.DB.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)')
        .bind(id, body.name, body.color).run();
      
      const tag = await env.DB.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first();
      return jsonResponse(tag, 201);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
  
  return jsonResponse({ error: 'Not found' }, 404);
}

// ============= 主处理函数 =============
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // API 路由
    if (path.startsWith('/api/') || path === '/health') {
      return handleAPI(request, env, path);
    }
    
    // 静态JS文件
    if (path.startsWith('/assets/') && path.endsWith('.js')) {
      return new Response(APP_JS, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    }
    
    // 所有其他路由返回 index.html (SPA)
    return htmlResponse(INDEX_HTML);
  }
};
`;

// 写入文件
const outputPath = path.join(__dirname, '../worker.js');
fs.writeFileSync(outputPath, workerCode);

console.log('✅ worker.js 已生成:', outputPath);
console.log('📄 文件大小:', (fs.statSync(outputPath).size / 1024).toFixed(2), 'KB');
