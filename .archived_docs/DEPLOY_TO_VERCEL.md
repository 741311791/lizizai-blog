# 部署到 Vercel 指南

本文档提供将前端项目部署到 Vercel 的详细步骤。

## 方案一：通过 GitHub 推送（推荐）

### 步骤 1: 推送代码到 GitHub

代码已经在本地提交，现在需要推送到 GitHub 仓库：

```bash
cd /home/ubuntu/letters-clone
git push -u origin main
```

如果遇到认证问题，请使用 GitHub Personal Access Token：

1. 访问 https://github.com/settings/tokens
2. 生成新的 token（勾选 `repo` 权限）
3. 使用 token 作为密码推送：

```bash
git remote set-url origin https://<YOUR_TOKEN>@github.com/741311791/lizizai-blog.git
git push -u origin main
```

### 步骤 2: 在 Vercel 中导入项目

1. 访问 https://vercel.com/dashboard
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 找到 `lizizai-blog` 仓库并点击 "Import"

### 步骤 3: 配置项目设置

在 Vercel 项目配置页面：

**Framework Preset**: Next.js（自动检测）

**Root Directory**: `frontend`（重要！）

**Build Command**: 
```bash
pnpm run build
```

**Output Directory**: 
```
.next
```

**Install Command**:
```bash
pnpm install
```

### 步骤 4: 配置环境变量

在 "Environment Variables" 部分添加：

```
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_GRAPHQL_URL=http://localhost:1337/graphql
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

**注意**: 这些是临时值，后端部署后需要更新为实际的后端 URL。

### 步骤 5: 部署

点击 "Deploy" 按钮，Vercel 将自动：
1. 克隆仓库
2. 安装依赖
3. 构建项目
4. 部署到 CDN

部署通常需要 2-5 分钟。

---

## 方案二：使用 Vercel CLI

### 安装 Vercel CLI

```bash
npm install -g vercel
```

### 登录 Vercel

```bash
vercel login
```

### 部署项目

```bash
cd /home/ubuntu/letters-clone/frontend
vercel
```

按照提示操作：
1. Set up and deploy? `Y`
2. Which scope? 选择你的账户
3. Link to existing project? `N`
4. What's your project's name? `lizizai-blog`
5. In which directory is your code located? `./`
6. Want to override the settings? `N`

### 部署到生产环境

```bash
vercel --prod
```

---

## 方案三：通过 Vercel 网页直接导入

如果 GitHub 仓库已经存在代码：

1. 访问 https://vercel.com/new
2. 选择 "Import Git Repository"
3. 输入仓库 URL: `https://github.com/741311791/lizizai-blog`
4. 点击 "Import"
5. 配置 Root Directory 为 `frontend`
6. 点击 "Deploy"

---

## 后端部署后的配置更新

当后端部署到 Render 或其他平台后，需要更新 Vercel 环境变量：

1. 在 Vercel 项目设置中找到 "Environment Variables"
2. 更新以下变量：

```
NEXT_PUBLIC_STRAPI_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_STRAPI_GRAPHQL_URL=https://your-backend.onrender.com/graphql
NEXT_PUBLIC_STRAPI_URL=https://your-backend.onrender.com
```

3. 点击 "Save"
4. 触发重新部署（Deployments → 点击最新部署的 "..." → "Redeploy"）

---

## 自定义域名配置

### 在 Vercel 中添加域名

1. 进入项目设置
2. 点击 "Domains"
3. 输入你的域名（如 `blog.example.com`）
4. 点击 "Add"

### 配置 DNS 记录

在你的域名提供商处添加以下记录：

**A 记录**:
```
Type: A
Name: @ (或你的子域名)
Value: 76.76.21.21
```

**CNAME 记录**（推荐）:
```
Type: CNAME
Name: blog (或你的子域名)
Value: cname.vercel-dns.com
```

DNS 生效通常需要几分钟到几小时。

---

## 故障排除

### 构建失败

**问题**: "Module not found" 错误
**解决**: 确保 Root Directory 设置为 `frontend`

**问题**: "pnpm: command not found"
**解决**: 在项目设置中添加环境变量 `ENABLE_EXPERIMENTAL_COREPACK=1`

### 运行时错误

**问题**: API 连接失败
**解决**: 检查环境变量是否正确配置

**问题**: 图片无法加载
**解决**: 在 `next.config.ts` 中配置 `images.domains`

### 部署速度慢

**问题**: 部署时间超过 10 分钟
**解决**: 
1. 检查依赖包大小
2. 启用 Vercel 的 Build Cache
3. 考虑使用 Turbopack

---

## 监控和分析

### 启用 Vercel Analytics

1. 在项目设置中找到 "Analytics"
2. 点击 "Enable"
3. 在代码中添加（可选）：

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 查看部署日志

1. 进入项目的 "Deployments" 页面
2. 点击任意部署
3. 查看 "Building" 和 "Runtime Logs"

---

## 自动部署

Vercel 会自动监听 GitHub 仓库的变化：

- **Push to main**: 自动部署到生产环境
- **Pull Request**: 创建预览部署
- **Push to other branches**: 创建分支预览

---

## 下一步

1. ✅ 部署前端到 Vercel
2. 🔲 部署后端到 Render（参考 DEPLOYMENT.md）
3. 🔲 更新前端环境变量
4. 🔲 配置自定义域名
5. 🔲 启用分析和监控

---

## 有用的链接

- Vercel 文档: https://vercel.com/docs
- Next.js 部署: https://nextjs.org/docs/deployment
- Vercel CLI: https://vercel.com/docs/cli
- GitHub 集成: https://vercel.com/docs/git/vercel-for-github
