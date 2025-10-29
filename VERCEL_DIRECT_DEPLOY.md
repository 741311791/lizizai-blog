# Vercel 直接部署指南（无需 GitHub）

由于 GitHub Token 权限限制，我们可以使用 Vercel CLI 直接部署项目，无需推送到 GitHub。

## 方法 1: 使用 Vercel CLI（推荐）

### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel

```bash
vercel login
```

按照提示选择登录方式（GitHub、GitLab、Bitbucket 或 Email）

### 步骤 3: 部署前端项目

```bash
cd /home/ubuntu/letters-clone/frontend
vercel
```

按照提示操作：
- **Set up and deploy?** → `Y`
- **Which scope?** → 选择你的账户
- **Link to existing project?** → `N`
- **What's your project's name?** → `lizizai-blog`
- **In which directory is your code located?** → `./`
- **Want to override the settings?** → `N`

### 步骤 4: 部署到生产环境

```bash
vercel --prod
```

部署完成后，Vercel 会提供一个 URL，例如：
```
https://lizizai-blog.vercel.app
```

---

## 方法 2: 手动上传到 GitHub

如果您想使用 GitHub，需要重新生成一个具有完整 `repo` 权限的 Token：

### 生成新的 GitHub Token

1. 访问 https://github.com/settings/tokens/new
2. 填写信息：
   - **Note**: `Vercel Deploy Token`
   - **Expiration**: 选择合适的过期时间
   - **Scopes**: 勾选以下权限：
     - ✅ `repo` (完整仓库访问权限)
     - ✅ `workflow` (如果需要 GitHub Actions)
3. 点击 "Generate token"
4. 复制生成的 Token

### 使用新 Token 推送

```bash
cd /home/ubuntu/letters-clone
git remote set-url origin https://<NEW_TOKEN>@github.com/741311791/lizizai-blog.git
git push -u origin main --force
```

---

## 方法 3: 压缩包上传

### 步骤 1: 下载项目压缩包

项目已经打包在：
```
/home/ubuntu/letters-clone.tar.gz
```

### 步骤 2: 解压到本地

```bash
tar -xzf letters-clone.tar.gz
cd letters-clone
```

### 步骤 3: 手动推送到 GitHub

```bash
cd letters-clone
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/741311791/lizizai-blog.git
git push -u origin main --force
```

### 步骤 4: 在 Vercel 导入

1. 访问 https://vercel.com/new
2. 选择 "Import Git Repository"
3. 选择 `lizizai-blog` 仓库
4. 配置：
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
5. 点击 "Deploy"

---

## 环境变量配置

无论使用哪种方法，部署后都需要在 Vercel 项目设置中配置环境变量：

```
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_GRAPHQL_URL=http://localhost:1337/graphql
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

**注意**: 这些是临时值，后端部署后需要更新。

---

## 推荐流程

由于 Token 权限问题，我建议：

### 选项 A: 使用 Vercel CLI（最快）
1. 安装 Vercel CLI
2. 直接从 `/home/ubuntu/letters-clone/frontend` 部署
3. 无需 GitHub

### 选项 B: 重新生成 Token
1. 生成具有完整 `repo` 权限的新 Token
2. 推送到 GitHub
3. 通过 Vercel 网页导入

### 选项 C: 本地操作
1. 下载压缩包到本地
2. 在本地推送到 GitHub
3. 通过 Vercel 网页导入

---

## 故障排除

### Token 权限不足

**错误**: `Permission denied` 或 `403 Forbidden`

**解决**: 
1. 确保 Token 有 `repo` 权限
2. 检查 Token 是否过期
3. 重新生成 Token

### Vercel CLI 部署失败

**错误**: `Build failed`

**解决**:
1. 确保在 `frontend` 目录下运行
2. 检查 `package.json` 是否存在
3. 确保依赖已安装：`pnpm install`

---

## 下一步

部署成功后：

1. ✅ 访问 Vercel 提供的 URL
2. 🔲 配置自定义域名
3. 🔲 部署后端到 Render
4. 🔲 更新前端环境变量
5. 🔲 重新部署前端

---

## 需要帮助？

如果遇到问题，请检查：
- Vercel 部署日志
- GitHub Token 权限
- 网络连接状态
