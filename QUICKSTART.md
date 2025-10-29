# 快速开始指南

本指南帮助你在 5 分钟内启动 Letters Clone 项目。

## 系统要求

- Node.js 18 或更高版本
- pnpm（推荐）或 npm
- Git

## 快速启动

### 1. 启动后端（Strapi）

```bash
# 进入后端目录
cd backend

# 启动开发服务器
pnpm run develop
```

首次启动时：
1. 浏览器会自动打开 `http://localhost:1337/admin`
2. 创建管理员账户（邮箱、用户名、密码）
3. 登录后台管理系统

### 2. 配置 API 权限

在 Strapi 管理后台：

1. 点击左侧菜单 **Settings** → **Users & Permissions Plugin** → **Roles**
2. 点击 **Public** 角色
3. 展开所有内容类型（Article, Author, Category, Comment, Newsletter）
4. 勾选以下权限：
   - ✅ find
   - ✅ findOne
5. 点击右上角 **Save** 保存

### 3. 启动前端（Next.js）

打开新的终端窗口：

```bash
# 进入前端目录
cd frontend

# 启动开发服务器
pnpm run dev
```

### 4. 访问应用

- **前端**: http://localhost:3000
- **后端管理**: http://localhost:1337/admin
- **GraphQL Playground**: http://localhost:1337/graphql

## 添加示例内容

### 创建作者

1. 在 Strapi 管理后台，点击 **Content Manager** → **Author**
2. 点击 **Create new entry**
3. 填写信息：
   - Name: DAN KOE
   - Bio: Content creator and entrepreneur
4. 点击 **Save** 和 **Publish**

### 创建分类

1. 点击 **Content Manager** → **Category**
2. 创建以下分类：
   - AI & Prompts
   - Writing Strategies
   - Marketing Strategies
   - HUMAN 3.0

### 创建文章

1. 点击 **Content Manager** → **Article**
2. 点击 **Create new entry**
3. 填写信息：
   - Title: You have about 36 months to make it
   - Subtitle: why everyone is racing to get rich
   - Content: 文章正文（使用富文本编辑器）
   - Author: 选择刚创建的作者
   - Category: 选择一个分类
   - Featured Image: 上传图片
4. 点击 **Save** 和 **Publish**

## 常见问题

### Q: 端口被占用怎么办？

**前端端口冲突**:
```bash
# 使用其他端口启动
PORT=3001 pnpm run dev
```

**后端端口冲突**:
编辑 `backend/config/server.ts`，修改端口号。

### Q: 前端无法连接后端？

检查 `frontend/.env.local` 文件是否存在且配置正确：
```
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_GRAPHQL_URL=http://localhost:1337/graphql
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

### Q: 数据库文件在哪里？

默认使用 SQLite，数据库文件位于：
```
backend/.tmp/data.db
```

### Q: 如何重置数据库？

```bash
cd backend
rm -rf .tmp/data.db
pnpm run develop
```

## 下一步

- 📖 阅读完整的 [README.md](./README.md)
- 🚀 查看 [部署指南](./DEPLOYMENT.md)
- 🎨 自定义主题和样式
- 📝 添加更多内容

## 获取帮助

- 查看 [Strapi 文档](https://docs.strapi.io)
- 查看 [Next.js 文档](https://nextjs.org/docs)
- 提交 Issue 到项目仓库
