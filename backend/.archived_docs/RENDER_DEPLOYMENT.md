# Render 部署指南

## 前置条件

1. Render 账号
2. GitHub 仓库已推送最新代码
3. Supabase PostgreSQL 数据库连接信息

## 部署步骤

### 1. 在 Render 创建 Web Service

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 点击 "New +" → "Web Service"
3. 连接 GitHub 仓库: `741311791/lizizai-blog`
4. 配置服务:
   - **Name**: `letters-clone-strapi`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `NODE_ENV=production pnpm start`
   - **Plan**: Free

### 2. 配置环境变量

在 Render 的 Environment 标签页中添加以下环境变量：

#### 服务器配置
```
HOST=0.0.0.0
PORT=10000
NODE_ENV=production
NODE_VERSION=22.13.0
```

#### 数据库配置 (Supabase PostgreSQL)
```
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://postgres.guucwbjysexvochrnhco:HPSRs7pl5NQ5m3bR@aws-1-us-east-1.pooler.supabase.com:5432/postgres
DATABASE_HOST=db.guucwbjysexvochrnhco.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres.guucwbjysexvochrnhco
DATABASE_PASSWORD=HPSRs7pl5NQ5m3bR
DATABASE_SSL=false
DATABASE_SCHEMA=public
```

#### Strapi 密钥 (使用现有或生成新的)
```
APP_KEYS=5EZACYI6vwO5hugKBWLgqw==,4mhU/P9ElTQRWZAvEtFCsw==,eDAP2yZ/6l6cb0AUt997MQ==,iQoA2dkTpNaV+bXpQGIBBQ==
API_TOKEN_SALT=/IAb30Ao+pxpqi25Dg5+Bw==
ADMIN_JWT_SECRET=88noAMbZV1OAFv6LS6XwVQ==
TRANSFER_TOKEN_SALT=H3NxD3s1scIJJRScaiB+Fg==
ENCRYPTION_KEY=17jVuuhkqmliw6JhrBvZ0g==
JWT_SECRET=h1kQYx7NhkxUkxxJ5tm6gqOWB9K72EJdMhDlrxGY00wMIUAa/cyz9T1op9nuUIYfgRbZcd3ckr0lRw0UHmAkVQ==
```

### 3. 部署

1. 点击 "Create Web Service"
2. Render 将自动开始构建和部署
3. 等待部署完成（大约 5-10 分钟）
4. 部署成功后，您将获得一个 URL，例如: `https://letters-clone-strapi.onrender.com`

### 4. 访问 Strapi 管理面板

1. 访问: `https://letters-clone-strapi.onrender.com/admin`
2. 创建第一个管理员账户
3. 登录后即可开始配置内容类型

## 注意事项

### SSL 证书问题

由于 Supabase 使用自签名证书，数据库配置中已设置：
```typescript
ssl: {
  rejectUnauthorized: false,
}
```

### Free Plan 限制

Render Free Plan 的限制：
- 服务在 15 分钟不活动后会休眠
- 首次访问可能需要 30-60 秒唤醒
- 每月 750 小时免费运行时间
- 适合开发和测试环境

### 生产环境建议

对于生产环境，建议：
1. 升级到 Render Starter Plan ($7/月)
2. 配置自定义域名
3. 启用 SSL 证书
4. 配置 CDN（如 Cloudflare）
5. 设置数据库备份策略

## 故障排查

### 构建失败

如果构建失败，检查：
1. `pnpm-lock.yaml` 是否已提交
2. Node 版本是否正确（22.13.0）
3. 所有依赖是否已安装

### 数据库连接失败

如果数据库连接失败，检查：
1. 数据库 URL 是否正确
2. 数据库凭据是否有效
3. SSL 配置是否正确
4. Supabase 数据库是否在线

### 启动失败

如果服务启动失败，检查：
1. 所有必需的环境变量是否已设置
2. PORT 是否设置为 10000
3. 查看 Render 日志获取详细错误信息

## 更新部署

要更新部署：
1. 推送代码到 GitHub main 分支
2. Render 将自动检测更改并重新部署
3. 或在 Render Dashboard 手动触发部署

## 监控和日志

在 Render Dashboard 中可以：
- 查看实时日志
- 监控服务状态
- 查看资源使用情况
- 配置告警通知

## 下一步

部署成功后：
1. 创建内容类型（Article, Category, Author, Comment, Tag）
2. 配置权限和角色
3. 导入初始数据
4. 更新前端 API URL
5. 测试 API 端点
