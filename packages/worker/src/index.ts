import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import type { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';
import { authRequired, requireRole, getAuthUser, genId } from './middleware/auth';
import type {
  Customer, CustomerInsert, CustomerUpdate,
  Contact, ContactInsert, ContactUpdate,
  Deal, DealInsert, DealUpdate,
  Interaction, InteractionInsert,
  Tag, TagInsert,
  PaginatedResponse,
} from './db/schema';

// ── Bindings ───────────────────────────────────────────

type Bindings = {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  KV: KVNamespace;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ── Global middleware ──────────────────────────────────

app.use('*', cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Error handler ──────────────────────────────────────

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ── Public routes ──────────────────────────────────────

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const user = await c.env.DB
    .prepare('SELECT id, email, password_hash, name, role FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; password_hash: string; name: string; role: string }>();

  if (!user || user.password_hash !== password) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const token = await sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    c.env.JWT_SECRET,
    'HS256',
  );

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// ── Protected routes ──────────────────────────────────

const api = new Hono<{ Bindings: Bindings }>();
api.use('*', authRequired());
api.use('*', requireRole('admin', 'manager', 'user'));

// GET /api/me
api.get('/me', (c) => {
  const user = getAuthUser(c);
  return c.json(user);
});

// ── Customers ──────────────────────────────────────────

// GET /api/customers
api.get('/customers', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const perPage = Math.min(parseInt(c.req.query('per_page') || '20', 10), 100);
  const offset = (page - 1) * perPage;

  const countResult = await c.env.DB
    .prepare('SELECT COUNT(*) as total FROM customers')
    .all<{ total: number }>();
  const total = countResult.results[0].total;

  const listResult = await c.env.DB
    .prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(perPage, offset)
    .all<Customer>();

  const response: PaginatedResponse<Customer> = {
    data: listResult.results,
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
  return c.json(response);
});

// GET /api/customers/:id
api.get('/customers/:id', async (c) => {
  const customer = await c.env.DB
    .prepare('SELECT * FROM customers WHERE id = ?')
    .bind(c.req.param('id'))
    .first<Customer>();
  if (!customer) return c.json({ error: 'Not found' }, 404);
  return c.json(customer);
});

// POST /api/customers
api.post('/customers', async (c) => {
  const body = await c.req.json<CustomerInsert>();
  const user = getAuthUser(c);
  const id = genId();
  await c.env.DB
    .prepare(`INSERT INTO customers (id, name, company, industry, status, source, email, phone, address, website, notes, assigned_to, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, body.name, body.company ?? null, body.industry ?? null, body.status ?? 'lead',
          body.source ?? null, body.email ?? null, body.phone ?? null, body.address ?? null,
          body.website ?? null, body.notes ?? null, body.assigned_to ?? null, user.sub)
    .run();
  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first<Customer>();
  return c.json(customer, 201);
});

// PATCH /api/customers/:id
api.patch('/customers/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT id FROM customers WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<CustomerUpdate>();
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);
  sets.push("updated_at = datetime('now')");
  values.push(id);

  await c.env.DB.prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first<Customer>();
  return c.json(customer);
});

// DELETE /api/customers/:id
api.delete('/customers/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT id FROM customers WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Not found' }, 404);
  await c.env.DB.prepare('DELETE FROM customers WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// ── Contacts ───────────────────────────────────────────

api.get('/customers/:customerId/contacts', async (c) => {
  const result = await c.env.DB
    .prepare('SELECT * FROM contacts WHERE customer_id = ? ORDER BY is_primary DESC, created_at DESC')
    .bind(c.req.param('customerId'))
    .all<Contact>();
  return c.json(result.results);
});

api.post('/customers/:customerId/contacts', async (c) => {
  const body = await c.req.json<ContactInsert>();
  const id = genId();
  await c.env.DB
    .prepare(`INSERT INTO contacts (id, customer_id, name, title, email, phone, department, is_primary, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, c.req.param('customerId'), body.name, body.title ?? null, body.email ?? null,
          body.phone ?? null, body.department ?? null, body.is_primary ?? 0, body.notes ?? null)
    .run();
  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first<Contact>();
  return c.json(contact, 201);
});

// ── Deals ──────────────────────────────────────────────

api.get('/deals', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const perPage = Math.min(parseInt(c.req.query('per_page') || '20', 10), 100);
  const offset = (page - 1) * perPage;
  const stage = c.req.query('stage');

  let whereClause = '';
  const params: unknown[] = [];

  if (stage) {
    whereClause = ' WHERE stage = ?';
    params.push(stage);
  }

  const countResult = await c.env.DB
    .prepare(`SELECT COUNT(*) as total FROM deals${whereClause}`)
    .bind(...params)
    .all<{ total: number }>();
  const total = countResult.results[0].total;

  const listResult = await c.env.DB
    .prepare(`SELECT * FROM deals${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...params, perPage, offset)
    .all<Deal>();

  const response: PaginatedResponse<Deal> = {
    data: listResult.results,
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
  return c.json(response);
});

api.post('/deals', async (c) => {
  const body = await c.req.json<DealInsert>();
  const user = getAuthUser(c);
  const id = genId();
  await c.env.DB
    .prepare(`INSERT INTO deals (id, customer_id, title, amount, stage, probability, expected_close_date, contact_id, assigned_to, notes, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, body.customer_id, body.title, body.amount, body.stage ?? 'qualification',
          body.probability ?? 20, body.expected_close_date ?? null, body.contact_id ?? null,
          body.assigned_to ?? null, body.notes ?? null, user.sub)
    .run();
  const deal = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first<Deal>();
  return c.json(deal, 201);
});

// ── Interactions ───────────────────────────────────────

api.get('/customers/:customerId/interactions', async (c) => {
  const result = await c.env.DB
    .prepare('SELECT * FROM interactions WHERE customer_id = ? ORDER BY occurred_at DESC, created_at DESC')
    .bind(c.req.param('customerId'))
    .all<Interaction>();
  return c.json(result.results);
});

api.post('/interactions', async (c) => {
  const body = await c.req.json<InteractionInsert>();
  const user = getAuthUser(c);
  const id = genId();
  await c.env.DB
    .prepare(`INSERT INTO interactions (id, customer_id, deal_id, type, subject, body, contact_id, occurred_at, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, body.customer_id, body.deal_id ?? null, body.type, body.subject,
          body.body ?? null, body.contact_id ?? null, body.occurred_at ?? null, user.sub)
    .run();
  const interaction = await c.env.DB.prepare('SELECT * FROM interactions WHERE id = ?').bind(id).first<Interaction>();
  return c.json(interaction, 201);
});

// ── Tags ───────────────────────────────────────────────

api.get('/tags', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM tags ORDER BY name').all<Tag>();
  return c.json(result.results);
});

api.post('/tags', async (c) => {
  const body = await c.req.json<TagInsert>();
  const id = genId();
  await c.env.DB.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)')
    .bind(id, body.name, body.color).run();
  const tag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first<Tag>();
  return c.json(tag, 201);
});

// ── Mount protected routes ─────────────────────────────

app.route('/api', api);

// ── Health check ───────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }));

export default app;
