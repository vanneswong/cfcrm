# CRM Cloudflare

## 项目概览

基于 Cloudflare 全栈架构的客户关系管理（CRM）系统，前后端一体部署。

### 技术栈
- **前端**: React 19 + TypeScript + Vite 6 + React Router v7
- **后端**: Hono v4 运行在 Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **认证**: JWT (HS256)

### 访问地址
- **生产环境**: https://crm.vannes.top

### 默认账户
- **邮箱**: `admin@crm.local`
- **密码**: `admin123`
- **角色**: admin（拥有所有权限）

### 部署架构
- **前后端一体**：前端静态文件嵌入Worker，统一部署
- **账户管理**：管理员账户信息存储在Worker的环境变量/密钥中
- **数据库**：仅存储业务数据（客户、交易等），不存储用户信息

## 项目结构

```
cf-crm/
├── .env.example              # 环境变量示例
├── .gitignore                # Git忽略规则
├── README.md                 # 项目说明
├── agent.md                  # 项目文档（本文件）
├── docs/
│   └── DEPLOYMENT.md         # 部署指南
├── migrations/
│   └── 0001_init.sql         # 数据库迁移
├── package.json              # 根配置
└── packages/
    ├── worker/               # 后端
    │   ├── src/
    │   │   ├── index.ts      # API + 静态文件服务
    │   │   ├── middleware/    # 认证中间件
    │   │   └── db/           # 数据库类型
    │   └── wrangler.toml     # Worker配置
    └── frontend/             # 前端
        └── src/
            ├── pages/        # 页面组件
            ├── components/   # 通用组件
            └── api/          # API客户端
```

## 数据库设计

使用 Cloudflare D1 (SQLite)，共 7 张表：

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `customers` | 客户 | name, company, industry, status, email, phone |
| `contacts` | 联系人 | name, title, email, phone, customer_id |
| `deals` | 交易 | title, amount, stage, probability, customer_id |
| `interactions` | 沟通记录 | type, subject, body, customer_id |
| `tags` | 标签 | name, color |
| `customer_tags` | 客户-标签关联 | customer_id, tag_id |
| `documents` | 文档引用 | filename, r2_key, customer_id |

### 枚举类型

- **CustomerStatus**: `active` | `inactive` | `lead`
- **DealStage**: `qualification` | `needs_analysis` | `proposal` | `negotiation` | `closed_won` | `closed_lost`
- **InteractionType**: `call` | `meeting` | `email` | `note` | `task`

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `POST` | `/api/auth/login` | 登录 |
| `GET` | `/api/me` | 当前用户信息 |
| `GET` | `/api/customers` | 客户列表 |
| `GET` | `/api/customers/:id` | 客户详情 |
| `POST` | `/api/customers` | 新建客户 |
| `PATCH` | `/api/customers/:id` | 更新客户 |
| `DELETE` | `/api/customers/:id` | 删除客户 |
| `GET` | `/api/customers/:id/contacts` | 客户联系人 |
| `POST` | `/api/customers/:id/contacts` | 新建联系人 |
| `GET` | `/api/deals` | 交易列表 |
| `GET` | `/api/deals/:id` | 交易详情 |
| `POST` | `/api/deals` | 新建交易 |
| `GET` | `/api/customers/:id/interactions` | 沟通记录 |
| `POST` | `/api/interactions` | 新建沟通记录 |
| `GET` | `/api/tags` | 标签列表 |
| `POST` | `/api/tags` | 新建标签 |

## 前端路由

| 路径 | 页面 |
|------|------|
| `/login` | 登录页 |
| `/` | 仪表盘 |
| `/customers` | 客户列表 |
| `/customers/new` | 新建客户 |
| `/customers/:id` | 客户详情 |
| `/deals` | 交易列表 |
| `/deals/new` | 新建交易 |
| `/deals/:id` | 交易详情 |

## 本地开发

```bash
# 安装依赖
npm install

# 初始化本地数据库
npm run db:migrate:local

# 启动开发服务器
npm run dev:worker
```

访问 http://localhost:8787

## 部署

```bash
# 安装依赖
npm install

# 构建前端
npm run build:frontend

# 部署到Cloudflare
cd packages/worker && npx wrangler deploy
```

详细部署指南见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 环境变量

在 `packages/worker/wrangler.toml` 中配置：

```toml
[vars]
JWT_SECRET = "your-secret-key"
ADMIN_EMAIL = "admin@crm.local"
ADMIN_PASSWORD = "your-password"
ADMIN_NAME = "管理员"
```

生产环境建议在 Cloudflare Dashboard 中设置密钥。

## 设计风格

### 配色方案

- **主蓝色**: `#2563eb` —— 按钮、链接
- **深蓝背景**: `#1e293b` —— 侧边栏
- **成功绿**: `#16a34a` —— 活跃状态
- **警告橙**: `#d97706` —— 线索状态
- **错误红**: `#dc2626` —— 错误提示
- **灰色文字**: `#64748b` —— 次要文字
- **边框色**: `#d1d5db` —— 输入框

### 组件样式

- **卡片**: 白色背景、10px圆角、轻微阴影
- **按钮**: 主按钮蓝色、次要按钮白底灰边
- **输入框**: 灰色边框、8px圆角
- **标签**: 状态色背景、完全圆角

## 常见问题

**Q: 无法登录？**
检查环境变量 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 是否正确配置。

**Q: API返回500？**
确认D1数据库已执行迁移：`npm run db:migrate`

**Q: 如何修改密码？**
在Cloudflare Dashboard中修改 `ADMIN_PASSWORD` 密钥。

## 命令速查

| 命令 | 用途 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run build:frontend` | 构建前端 |
| `npm run deploy` | 部署Worker |
| `npm run db:migrate` | 远程数据库迁移 |
| `npm run db:migrate:local` | 本地数据库迁移 |
| `npx wrangler tail` | 查看实时日志 |
| `npx wrangler secret put <name>` | 设置密钥 |
