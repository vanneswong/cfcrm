# CRM Cloudflare - 前后端一体版

基于 Cloudflare Workers 的客户关系管理系统，前后端一体部署。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `packages/worker/wrangler.toml`：

```toml
[vars]
JWT_SECRET = "your-secret-key-here"
ADMIN_EMAIL = "admin@crm.local"
ADMIN_PASSWORD = "your-secure-password"
ADMIN_NAME = "管理员"
```

### 3. 初始化数据库

```bash
# 本地开发
npm run db:migrate:local

# 远程生产环境
npm run db:migrate
```

### 4. 构建和部署

**方式一：一键部署 (推荐)**

```bash
# Windows
build.bat

# Linux/Mac
chmod +x build.sh
./build.sh
```

**方式二：手动部署**

```bash
# 构建前端
npm run build:frontend

# 部署Worker
npm run deploy
```

**方式三：npm脚本**

```bash
npm run deploy:all
```

## 🏗️ 架构特点

### 前后端一体
- 前端构建为静态文件，嵌入到Worker中
- Worker同时处理API请求和静态文件服务
- 无需单独部署前端Pages

### 账户管理
- 管理员账户信息存储在Worker的环境变量/密钥中
- 数据库仅存储业务数据（客户、交易等）
- 支持通过Cloudflare Dashboard或CLI管理密钥

### 部署优势
- 单次部署，前后端统一管理
- 自动处理SPA路由
- 无需配置CORS跨域
- 统一域名访问

## 📁 项目结构

```
crm-cloudflare/
├── package.json              # monorepo根配置
├── build.bat/sh              # 构建脚本
├── migrations/
│   └── 0001_init.sql         # 数据库迁移
├── packages/
│   ├── worker/               # 后端 + 前端静态文件
│   │   ├── wrangler.toml     # 配置文件
│   │   └── src/
│   │       ├── index.ts      # API + 静态文件服务
│   │       ├── middleware/    # 认证中间件
│   │       └── db/           # 数据库类型定义
│   └── frontend/             # 前端源码
│       └── src/
│           ├── pages/        # 页面组件
│           ├── components/   # 通用组件
│           └── api/          # API客户端
└── README.md
```

## 🔧 本地开发

### 启动开发服务器

```bash
# 启动Worker (包含前后端)
npm run dev:worker

# 或者分别启动
npm run dev:worker    # 终端1: Worker (localhost:8787)
npm run dev:frontend  # 终端2: 前端 (localhost:3000)
```

### 访问地址

- **一体模式**: http://localhost:8787
- **分离模式**: http://localhost:3000 (前端) + http://localhost:8787 (API)

### 默认账户

- **邮箱**: `admin@crm.local`
- **密码**: `admin123` (或在wrangler.toml中配置的密码)

## 🌐 生产环境部署

### 环境变量配置

#### 方式一：wrangler.toml (适合开发)

直接修改 `packages/worker/wrangler.toml` 中的 `[vars]` 部分。

#### 方式二：Cloudflare Dashboard (推荐生产环境)

1. 进入 Workers and Pages → 选择 Worker `crm-api`
2. 点击 设置 → 变量和密钥
3. 添加以下变量：
   - `JWT_SECRET` (密钥类型)
   - `ADMIN_EMAIL` (文本类型)
   - `ADMIN_PASSWORD` (密钥类型)
   - `ADMIN_NAME` (文本类型)

#### 方式三：wrangler CLI

```bash
# 设置密钥
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_PASSWORD

# 设置普通变量
npx wrangler variable put ADMIN_EMAIL "admin@crm.local"
npx wrangler variable put ADMIN_NAME "管理员"
```

### 自定义域名

1. 在Cloudflare Dashboard中配置自定义域名
2. 绑定到Worker `crm-api`
3. 更新CORS配置（如需要）

## 🔍 故障排除

### 本地开发问题

**Q: API请求401？**
- 确认 `wrangler dev` 正在运行 (8787端口)
- 确认数据库已初始化

**Q: 前端页面空白？**
- 检查浏览器控制台错误
- 确认前端已正确构建

### 生产环境问题

**Q: 部署后API返回500？**
- 确认远程D1已执行迁移
- 检查Worker日志：`npx wrangler tail`
- 确认环境变量配置正确

**Q: 无法登录？**
- 确认环境变量 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 已设置
- 检查 `JWT_SECRET` 是否已配置
- 查看Worker日志获取详细错误信息

**Q: 如何修改管理员密码？**

```bash
# 使用wrangler CLI
npx wrangler secret put ADMIN_PASSWORD

# 或在Cloudflare Dashboard中修改
# Workers and Pages → crm-api → 设置 → 变量和密钥
```

## 📊 数据库管理

### 迁移命令

```bash
# 本地开发数据库
npm run db:migrate:local

# 远程生产数据库
npm run db:migrate
```

### 数据库表

- `customers` - 客户信息
- `contacts` - 联系人
- `deals` - 交易/销售管线
- `interactions` - 沟通记录
- `tags` - 标签
- `customer_tags` - 客户-标签关联
- `documents` - 文档引用

## 🛡️ 安全特性

- JWT认证 (HS256)
- 环境变量/密钥存储敏感信息
- CORS配置保护
- 角色权限控制 (admin/manager/user)

## 📈 性能优化

- 静态文件CDN分发
- 边缘计算 (Cloudflare Workers)
- SQLite数据库 (D1)
- 无服务器架构

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

---

**技术支持**: 如有问题，请查看 [DEVELOPMENT.md](docs/DEVELOPMENT.md) 或提交Issue。
