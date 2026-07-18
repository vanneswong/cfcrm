# Skill: 构建自包含 Worker.js

## 描述

将前后端代码打包成单个 `worker.js` 文件，可直接在 Cloudflare Dashboard 中部署，无需使用 Wrangler CLI。

## 适用场景

- 无法使用命令行部署时
- 需要在 Cloudflare Dashboard 中快速部署
- 需要将代码分享给他人部署

## 前置条件

- Node.js ≥ 18
- 已安装依赖：`npm install`
- 前端代码可正常构建

## 构建步骤

### 1. 构建前端

```bash
npm run build:frontend
```

生成 `packages/frontend/dist/` 目录，包含：
- `index.html` - 入口HTML
- `assets/*.js` - 打包后的JavaScript

### 2. 运行构建脚本

```bash
node scripts/build-worker.js
```

输出：
```
✅ worker.js 已生成: C:\Projects\cf-crm\worker.js
📄 文件大小: 288 KB
```

### 3. 部署到 Cloudflare Dashboard

1. 打开 https://dash.cloudflare.com
2. Workers 和 Pages → 创建 Worker
3. 快速编辑 → 删除默认代码
4. 粘贴 `worker.js` 全部内容
5. 保存并部署

### 4. 配置环境变量

在 Worker 设置 → 变量和密钥 中添加：

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `JWT_SECRET` | 密钥 | JWT签名密钥 |
| `ADMIN_EMAIL` | 文本 | 管理员邮箱 |
| `ADMIN_PASSWORD` | 密钥 | 管理员密码 |
| `ADMIN_NAME` | 文本 | 管理员显示名 |

### 5. 绑定 D1 数据库

在 Worker 设置 → 变量和密钥 → D1 数据库绑定：
- 变量名：`DB`
- 数据库：`crm-db`

## 技术实现

### 构建脚本结构

```
scripts/build-worker.js
├── 读取前端静态文件
│   ├── index.html
│   └── assets/*.js
├── 修改HTML（移除外部脚本引用）
├── 生成worker.js
│   ├── 前端代码（内联为字符串）
│   ├── JWT工具函数
│   ├── API路由处理
│   └── 主处理函数
└── 输出文件
```

### worker.js 结构

```javascript
// 前端静态文件
const INDEX_HTML = "...";
const APP_JS = "...";

// JWT工具函数
async function sign(payload, secret) { ... }
async function verify(token, secret) { ... }

// 工具函数
function generateId() { ... }
function jsonResponse(data, status) { ... }
function htmlResponse(html) { ... }

// 认证中间件
async function authenticate(request, env) { ... }

// API路由处理
async function handleAPI(request, env, path) { ... }

// 主处理函数
export default {
  async fetch(request, env) { ... }
};
```

### API 路由列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/me` | 当前用户 |
| GET | `/api/customers` | 客户列表 |
| GET | `/api/customers/:id` | 客户详情 |
| POST | `/api/customers` | 创建客户 |
| PATCH | `/api/customers/:id` | 更新客户 |
| DELETE | `/api/customers/:id` | 删除客户 |
| GET | `/api/customers/:id/contacts` | 联系人列表 |
| POST | `/api/customers/:id/contacts` | 创建联系人 |
| GET | `/api/deals` | 交易列表 |
| GET | `/api/deals/:id` | 交易详情 |
| POST | `/api/deals` | 创建交易 |
| GET | `/api/customers/:id/interactions` | 沟通记录 |
| POST | `/api/interactions` | 创建沟通记录 |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/tags` | 创建标签 |

## 限制

- 文件大小限制：10MB（当前约288KB）
- 不支持npm包（已打包为纯JavaScript）
- 每次更新需手动替换代码

## 故障排除

### 构建失败

```bash
# 确保依赖已安装
npm install

# 确保前端可正常构建
npm run build:frontend
```

### 部署后无法访问

1. 检查环境变量是否正确配置
2. 检查D1数据库绑定是否添加
3. 查看Worker日志：Dashboard → Worker → 日志

### API返回500

1. 确认D1数据库已执行迁移
2. 检查环境变量 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`

## 相关文件

- `scripts/build-worker.js` - 构建脚本
- `worker.js` - 生成的Worker文件
- `docs/WORKER_DEPLOY.md` - 部署说明
