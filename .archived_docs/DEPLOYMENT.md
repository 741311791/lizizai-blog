# 部署指南

本文档详细说明如何将 Letters Clone 项目部署到生产环境。

## 部署架构

- **前端**: Vercel (推荐) 或其他支持 Next.js 的平台
- **后端**: Render (推荐) 或其他支持 Node.js 的平台
- **数据库**: PostgreSQL 15

## 前端部署 (Vercel)

### 步骤 1: 准备代码仓库

1. 将项目推送到 GitHub/GitLab/Bitbucket
```bash
cd /home/ubuntu/letters-clone
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 步骤 2: 导入到 Vercel

1. 访问 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 导入你的 Git 仓库
4. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next`

### 步骤 3: 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_STRAPI_API_URL=https://your-strapi-backend.onrender.com/api
NEXT_PUBLIC_STRAPI_GRAPHQL_URL=https://your-strapi-backend.onrender.com/graphql
NEXT_PUBLIC_STRAPI_URL=https://your-strapi-backend.onrender.com
```

### 步骤 4: 部署

点击 "Deploy" 按钮，Vercel 将自动构建和部署你的前端应用。

---

## 后端部署 (Render)

### 步骤 1: 创建 PostgreSQL 数据库

1. 登录 [Render](https://render.com)
2. 点击 "New +" → "PostgreSQL"
3. 配置数据库：
   - **Name**: letters-clone-db
   - **Database**: letters_clone
   - **User**: 自动生成
   - **Region**: 选择最近的区域
   - **Plan**: 选择合适的计划
4. 创建后，保存连接信息（Internal Database URL）

### 步骤 2: 创建 Web Service

1. 点击 "New +" → "Web Service"
2. 连接你的 Git 仓库
3. 配置服务：
   - **Name**: letters-clone-backend
   - **Region**: 与数据库相同
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start`

### 步骤 3: 配置环境变量

添加以下环境变量：

```bash
# 数据库配置
DATABASE_CLIENT=postgres
DATABASE_HOST=<从 Render PostgreSQL 获取>
DATABASE_PORT=5432
DATABASE_NAME=letters_clone
DATABASE_USERNAME=<从 Render PostgreSQL 获取>
DATABASE_PASSWORD=<从 Render PostgreSQL 获取>
DATABASE_SSL=true

# Strapi 配置
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# 安全密钥（使用以下命令生成）
# openssl rand -base64 32
APP_KEYS=<生成的密钥1>,<生成的密钥2>
API_TOKEN_SALT=<生成的密钥>
ADMIN_JWT_SECRET=<生成的密钥>
JWT_SECRET=<生成的密钥>
TRANSFER_TOKEN_SALT=<生成的密钥>

# CORS 配置
CLIENT_URL=https://your-frontend.vercel.app
```

### 步骤 4: 生成安全密钥

在本地终端运行以下命令生成密钥：

```bash
# 生成 4 个不同的密钥
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

### 步骤 5: 部署

点击 "Create Web Service"，Render 将自动构建和部署后端。

### 步骤 6: 配置 Strapi

1. 部署完成后，访问 `https://your-backend.onrender.com/admin`
2. 创建管理员账户
3. 配置 API 权限：
   - Settings → Users & Permissions Plugin → Roles → Public
   - 为所有内容类型启用 `find` 和 `findOne` 权限
   - 保存更改

---

## 数据库迁移

如果你在本地开发时使用了 SQLite，需要将数据迁移到 PostgreSQL：

### 方法 1: 手动重新创建内容

1. 在生产环境的 Strapi 管理面板中手动创建内容

### 方法 2: 使用 Strapi 数据传输

```bash
# 导出本地数据
cd backend
pnpm strapi export --no-encrypt --file backup.tar.gz

# 导入到生产环境
pnpm strapi import --file backup.tar.gz
```

---

## CORS 配置

确保后端允许前端域名的跨域请求。

编辑 `backend/config/middlewares.ts`：

```typescript
export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://your-frontend.vercel.app',
        'http://localhost:3000',
      ],
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

---

## 域名配置

### 前端域名 (Vercel)

1. 在 Vercel 项目设置中添加自定义域名
2. 按照提示配置 DNS 记录

### 后端域名 (Render)

1. 在 Render 服务设置中添加自定义域名
2. 配置 DNS 记录指向 Render

---

## 监控和维护

### 日志查看

- **Vercel**: 在项目仪表板查看部署日志和运行时日志
- **Render**: 在服务仪表板查看日志

### 性能监控

- 使用 Vercel Analytics 监控前端性能
- 使用 Render Metrics 监控后端性能

### 备份

定期备份数据库：

```bash
# 在 Render 仪表板中创建数据库快照
# 或使用 pg_dump
pg_dump -h <host> -U <user> -d <database> > backup.sql
```

---

## 故障排除

### 前端无法连接后端

1. 检查环境变量是否正确配置
2. 检查 CORS 设置
3. 检查后端是否正常运行

### 后端启动失败

1. 检查数据库连接信息
2. 检查环境变量是否完整
3. 查看 Render 日志获取详细错误信息

### 图片上传失败

1. 配置 Strapi 使用云存储（如 AWS S3, Cloudinary）
2. 或使用 Render 的持久化磁盘

---

## 成本估算

### 免费方案
- **Vercel**: 免费版支持个人项目
- **Render**: 免费版（有限制，服务可能休眠）
- **PostgreSQL**: Render 免费版（90天后过期）

### 付费方案
- **Vercel Pro**: $20/月
- **Render Starter**: $7/月（Web Service）
- **Render PostgreSQL**: $7/月

---

## 安全建议

1. 定期更新依赖包
2. 使用强密码和密钥
3. 启用 HTTPS（Vercel 和 Render 默认启用）
4. 配置适当的 CORS 策略
5. 定期备份数据库
6. 监控异常访问和错误日志

---

## 下一步

部署完成后，你可以：

1. 添加自定义域名
2. 配置 CDN 加速
3. 设置 CI/CD 自动部署
4. 添加分析和监控工具
5. 优化 SEO 设置
