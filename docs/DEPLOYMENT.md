# Cloudflare Workers 部署指南

## 部署摘要

| 项目 | 值 |
|------|-----|
| Worker名称 | crm-api |
| 访问地址 | https://crm.vannes.top |
| D1数据库 | crm-db |
| 部署时间 | 2024-07-19 |

## 前置条件

1. 已安装 Node.js ≥ 18
2. 已安装 Wrangler CLI：`npm install -g wrangler`
3. 已登录 Cloudflare：`wrangler login`

## 部署步骤

### 1. 构建前端

```bash
npm run build:frontend
```

输出示例：
```
vite v6.4.2 building for production...
✓ 53 modules transformed.
dist/index.html                0.45 kB │ gzip:  0.35 kB
dist/assets/index-BYaj60of.js  271.79 kB │ gzip: 82.81 kB
✓ built in 2.48s
```

### 2. 部署 Worker

```bash
cd packages/worker
npx wrangler deploy
```

输出示例：
```
⛅️ wrangler 4.87.0

🌀 Building list of assets...
✨ Read 3 files from the assets directory
🌀 Starting asset upload...
✨ Success! Uploaded 2 files (2.56 sec)

Total Upload: 92.93 KiB / gzip: 22.10 KiB
Worker Startup Time: 1 ms

Uploaded crm-api (30.18 sec)
Deployed crm-api triggers (2.61 sec)
  https://crm.vannes.top
```

### 3. 配置自定义域名

在 Cloudflare Dashboard 中操作：

1. 进入 **Workers and Pages** → 选择 **crm-api**
2. 点击 **设置** → **触发器** → **自定义域**
3. 添加 `crm.vannes.top`
4. DNS 会自动添加 CNAME 记录

配置完成后，禁用 workers.dev 域名：
1. **设置** → **触发器** → 取消勾选"Workers.dev"子域

## 环境变量配置

### 当前配置（wrangler.toml）

```toml
[vars]
JWT_SECRET = "dev-secret-change-in-production-2025"
ADMIN_EMAIL = "admin@crm.local"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "管理员"
```

### 生产环境建议

在 Cloudflare Dashboard 中设置加密的密钥：

1. 进入 **Workers and Pages** → **crm-api** → **设置** → **变量和密钥**
2. 添加以下密钥：
   - `JWT_SECRET` (密钥类型) - 生产环境使用强密钥
   - `ADMIN_PASSWORD` (密钥类型) - 生产环境使用强密码

或使用 CLI：
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_PASSWORD
```

## 资源绑定

| 绑定 | 类型 | 名称 |
|------|------|------|
| DB | D1 Database | crm-db |
| ASSETS | Assets | 前端静态文件 |

## 访问系统

- **访问地址**: https://crm.vannes.top
- **管理员账户**: admin@crm.local / admin123

## 常用命令

```bash
# 构建前端
npm run build:frontend

# 部署 Worker
cd packages/worker && npx wrangler deploy

# 查看实时日志
npx wrangler tail

# 查看部署历史
npx wrangler deployments list

# 回滚版本
npx wrangler rollback <version-id>
```

## 故障排除

### 部署失败

```bash
# 检查 wrangler 版本
wrangler --version

# 重新登录
wrangler login

# 查看详细日志
npx wrangler deploy --verbose
```

### 无法访问

1. 确认自定义域名状态为"有效"
2. 检查 DNS 配置
3. 等待 DNS 生效（通常几分钟）

### 数据库错误

```bash
# 检查数据库连接
npx wrangler d1 execute crm-db --command="SELECT 1"

# 执行迁移
npm run db:migrate
```

## 更新日志

### 2024-07-19
- 初始部署
- 配置前后端一体架构
- 设置环境变量存储管理员账户
- 配置自定义域名 crm.vannes.top
- 禁用 workers.dev 域名
