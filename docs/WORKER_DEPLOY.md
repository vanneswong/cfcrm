# 通过 Cloudflare Dashboard 部署 worker.js

## 文件说明

`worker.js` 是一个自包含的 Worker 文件，包含：
- 后端 API 逻辑
- 前端 React 应用（内联）

## 部署步骤

### 1. 打开 Cloudflare Dashboard

访问 https://dash.cloudflare.com

### 2. 进入 Workers 页面

1. 左侧菜单选择 **Workers 和 Pages**
2. 点击 **创建应用程序**
3. 选择 **创建 Worker**

### 3. 创建 Worker

1. 输入名称：`crm-api`
2. 点击 **部署**

### 4. 替换代码

1. 点击 **快速编辑**
2. 删除所有默认代码
3. 复制 `worker.js` 的全部内容
4. 粘贴到编辑器中
5. 点击 **保存并部署**

### 5. 配置环境变量

1. 返回 Worker 详情页
2. 点击 **设置** → **变量和密钥**
3. 添加以下变量：

| 变量名 | 类型 | 值 |
|--------|------|-----|
| `JWT_SECRET` | 密钥 | 你的JWT密钥 |
| `ADMIN_EMAIL` | 文本 | admin@crm.local |
| `ADMIN_PASSWORD` | 密钥 | 你的管理员密码 |
| `ADMIN_NAME` | 文本 | 管理员 |

### 6. 配置 D1 数据库绑定

1. 点击 **设置** → **变量和密钥**
2. 点击 **D1 数据库绑定**
3. 添加绑定：
   - 变量名：`DB`
   - D1 数据库：选择 `crm-db`

### 7. 配置自定义域名

1. 点击 **设置** → **触发器**
2. 在 **自定义域** 部分点击 **添加自定义域**
3. 输入：`crm.vannes.top`
4. 等待 DNS 配置完成

## 重新生成 worker.js

如果代码有更新，运行：

```bash
node scripts/build-worker.js
```

然后重复步骤 4 替换代码。

## 注意事项

- `worker.js` 大小约 288KB，远低于 10MB 限制
- 前端代码已内联，无需单独部署
- 每次代码更新后需重新部署
