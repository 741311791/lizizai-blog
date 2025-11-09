# Lizizai Blog Backend

基于 Strapi 5.29.0 的博客后端系统，提供完整的文章管理、订阅服务和内容管理功能。

## 📋 目录

- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [开发指南](#开发指南)
- [测试](#测试)
- [部署指南](#部署指南)
- [项目结构](#项目结构)
- [API 文档](#api-文档)

## 🛠 技术栈

- **框架**: Strapi 5.29.0
- **语言**: TypeScript
- **数据库**: PostgreSQL / SQLite
- **邮件服务**: Resend
- **测试框架**: Jest + Supertest
- **包管理器**: pnpm
- **容器化**: Docker

## ✨ 功能特性

### 内容管理

- **文章管理** (Article): 支持文章创建、编辑、发布和分类
- **作者管理** (Author): 作者信息管理
- **分类管理** (Category): 文章分类系统
- **标签管理** (Tag): 文章标签系统
- **评论系统** (Comment): 文章评论功能
- **点赞功能** (Like): 文章点赞功能

### 订阅服务

- **邮件订阅**: 基于 Resend 的邮件订阅服务
- **订阅确认**: 双重确认机制，防止无效订阅
- **退订功能**: 支持用户取消订阅
- **订阅统计**: 订阅者数量统计

### 其他功能

- **GraphQL 支持**: 集成 GraphQL 插件，提供灵活的查询接口
- **健康检查**: 服务健康状态监控端点
- **RESTful API**: 标准的 REST API 接口
- **权限管理**: 基于角色的访问控制

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0 <= 22.x.x
- pnpm >= 8.0.0
- PostgreSQL（生产环境）或 SQLite（开发环境）

### 安装依赖

```bash
pnpm install
```

### 环境变量配置

复制 `.env.example` 文件并重命名为 `.env`，然后配置必要的环境变量：

```bash
cp .env.example .env
```

### 生成密钥

项目提供了脚本用于生成安全的密钥：

```bash
# 生成所有必需的密钥
pnpm run generate:secrets
```

或者手动生成：

```bash
# 生成 16 字节密钥（用于 APP_KEYS，需要生成 4 个）
openssl rand -base64 16

# 生成 32 字节密钥（用于其他密钥）
openssl rand -base64 32
```

### 启动开发服务器

```bash
pnpm run dev
```

服务器将在 `http://localhost:1337` 启动。

## ⚙️ 环境配置

### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` / `production` |
| `HOST` | 服务器监听地址 | `0.0.0.0` |
| `PORT` | 服务器端口 | `1337` |
| `APP_KEYS` | Cookie 加密密钥（4个，逗号分隔） | `key1,key2,key3,key4` |
| `API_TOKEN_SALT` | API Token 盐值 | 使用 `openssl rand -base64 32` 生成 |
| `ADMIN_JWT_SECRET` | 管理面板 JWT 密钥 | 使用 `openssl rand -base64 32` 生成 |
| `JWT_SECRET` | API JWT 密钥 | 使用 `openssl rand -base64 32` 生成 |
| `DATABASE_CLIENT` | 数据库类型 | `postgres` / `sqlite` |
| `DATABASE_URL` | 数据库连接字符串（PostgreSQL） | `postgres://user:pass@host:port/db` |
| `RESEND_API_KEY` | Resend 邮件服务 API 密钥 | `re_xxxxxxxxxxxxxxxxx` |

### 可选的环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `DATABASE_HOST` | 数据库主机地址 | `localhost` |
| `DATABASE_PORT` | 数据库端口 | `5432` (PostgreSQL) / `3306` (MySQL) |
| `DATABASE_NAME` | 数据库名称 | `strapi` |
| `DATABASE_USERNAME` | 数据库用户名 | `strapi` |
| `DATABASE_PASSWORD` | 数据库密码 | `strapi` |
| `DATABASE_SSL` | 是否启用 SSL 连接 | `false` |
| `EMAIL_FROM` | 发件人邮箱地址 | `Onboarding <onboarding@resend.dev>` |
| `FRONTEND_URL` | 前端 URL（用于邮件链接） | - |

### 验证环境变量

项目提供了环境变量验证脚本：

```bash
pnpm run validate:env
```

## 💻 开发指南

### 可用脚本

```bash
# 开发模式启动
pnpm run dev
# 或
pnpm run develop

# 构建生产版本
pnpm run build

# 启动生产服务器
pnpm run start

# 生成密钥
pnpm run generate:secrets

# 验证环境变量
pnpm run validate:env

# 运行测试
pnpm run test

# 监听模式运行测试
pnpm run test:watch

# 生成测试覆盖率报告
pnpm run test:coverage

# CI 模式运行测试
pnpm run test:ci

# Strapi 控制台
pnpm run console

# 升级 Strapi
pnpm run upgrade
```

### 代码结构

项目采用 Strapi 标准结构：

```
backend/
├── config/              # 配置文件
│   ├── admin.ts        # 管理面板配置
│   ├── api.ts          # API 配置
│   ├── database.ts     # 数据库配置
│   ├── middlewares.ts  # 中间件配置
│   ├── plugins.ts      # 插件配置
│   └── server.ts       # 服务器配置
├── src/
│   ├── api/            # API 路由和控制器
│   │   ├── article/    # 文章 API
│   │   ├── author/     # 作者 API
│   │   ├── category/   # 分类 API
│   │   ├── comment/    # 评论 API
│   │   ├── health/     # 健康检查 API
│   │   ├── like/       # 点赞 API
│   │   ├── subscriber/ # 订阅者 API
│   │   └── tag/        # 标签 API
│   ├── components/     # 共享组件
│   ├── extensions/     # 扩展功能
│   ├── plugins/        # 自定义插件
│   ├── utils/          # 工具函数
│   └── index.ts        # 入口文件
├── tests/              # 测试文件
│   ├── api/            # API 测试
│   ├── helpers/        # 测试辅助工具
│   └── setup/          # 测试配置
└── scripts/            # 脚本文件
```

### 自定义路由

项目在 `src/index.ts` 中注册了自定义路由：

- `POST /api/subscribers/subscribe` - 订阅
- `POST /api/subscribers/unsubscribe` - 取消订阅
- `GET /api/subscribers/count` - 获取订阅者数量
- `GET /api/subscribe/confirm` - 确认订阅

## 🧪 测试

项目使用 Jest 作为测试框架，Supertest 用于 API 测试。

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 监听模式（开发时推荐）
pnpm run test:watch

# 生成覆盖率报告
pnpm run test:coverage

# CI 模式（并行执行，生成覆盖率）
pnpm run test:ci
```

### 测试配置

测试配置文件位于 `jest.config.ts`，测试环境配置位于 `tsconfig.test.json`。

### 测试覆盖

当前测试覆盖以下 API：

- ✅ 健康检查 API (`/api/health`)
- ✅ 文章 API (`/api/articles`)
- ✅ 订阅者 API (`/api/subscribers`)

### 测试辅助工具

测试辅助工具位于 `tests/helpers/api-client.ts`，提供了便捷的 API 请求方法。

## 🚢 部署指南

### 方式一：Render 部署（推荐）

Render 提供了便捷的托管服务，支持自动部署。

#### 步骤 1: 创建 PostgreSQL 数据库

1. 在 Render Dashboard 点击 **New +** > **PostgreSQL**
2. 填写数据库名称，选择区域和计划
3. 创建完成后，在数据库的 **Info** 页面复制 **Internal Connection URL**，用于 `DATABASE_URL` 环境变量

#### 步骤 2: 创建 Web 服务

1. 在 Render Dashboard 点击 **New +** > **Web Service**
2. 连接 GitHub 仓库 (`741311791/lizizai-blog`)
3. 配置服务：
   - **Name**: 服务名称，如 `lizizai-blog-backend`
   - **Region**: 选择与数据库相近的区域
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Instance Type**: 选择合适的计划（免费计划可用于开发测试）

#### 步骤 3: 配置环境变量

1. 进入 Web 服务的 **Environment** 标签页
2. 添加所有必需的环境变量（参考 [环境配置](#环境配置)）
3. 对于 `DATABASE_URL`，使用步骤 1 中复制的连接字符串
4. 对于 `RESEND_API_KEY`，从 [Resend Dashboard](https://resend.com/api-keys) 获取

#### 步骤 4: 部署

1. 点击 **Create Web Service**
2. Render 将自动开始构建和部署
3. 部署完成后，API 将在 Render 提供的 URL 上可用（如 `https://your-service-name.onrender.com`）

### 方式二：Docker 部署

使用 Docker 可以部署到任何云平台或自己的服务器。

#### 步骤 1: 配置 docker-compose.yml

1. 打开 `backend/docker-compose.yml`
2. **重要**: 替换所有占位符值：
   - 更新 `DATABASE_*` 变量指向生产数据库
   - 替换所有密钥占位符（`APP_KEYS`、`API_TOKEN_SALT` 等）
   - **不要将密钥提交到版本控制**，使用 `.env` 文件或平台密钥管理

#### 步骤 2: 构建和运行

```bash
# 构建 Docker 镜像
docker-compose build

# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务将在主机的 `1337` 端口可用。

### 方式三：Zeabur 部署

项目包含 `zeabur.json` 配置文件，可以直接部署到 Zeabur。

1. 在 Zeabur 创建新项目
2. 连接 GitHub 仓库
3. 配置环境变量
4. 部署

### 部署后配置

首次部署后，需要配置 Strapi 管理面板：

1. 访问 `https://your-backend-url/admin`
2. 创建第一个管理员账户
3. 进入 **Settings** > **Users & Permissions Plugin** > **Roles**
4. 选择 **Public** 角色
5. 启用以下权限：
   - `Article`: `find`、`findOne`
   - `Category`: `find`、`findOne`
   - `Author`: `find`、`findOne`
   - `Tag`: `find`、`findOne`
   - `Subscriber`: `subscribe`
6. 点击 **Save**

## 📁 项目结构

详细的目录结构说明：

```
backend/
├── config/                    # Strapi 配置文件
│   ├── admin.ts              # 管理面板配置
│   ├── api.ts                # API 配置（分页、限制等）
│   ├── database.ts           # 数据库连接配置
│   ├── middlewares.ts        # 中间件配置
│   ├── plugins.ts            # 插件配置
│   └── server.ts             # 服务器配置
├── database/                  # 数据库迁移文件
│   └── migrations/           # 数据库迁移脚本
├── dist/                      # 编译后的文件（生产构建）
├── public/                    # 公共静态文件
│   ├── robots.txt            # 爬虫配置文件
│   └── uploads/              # 上传的文件目录
├── scripts/                   # 辅助脚本
│   ├── generate-secrets.js   # 密钥生成脚本
│   └── validate-env.js       # 环境变量验证脚本
├── src/                       # 源代码目录
│   ├── api/                   # API 路由和控制器
│   │   ├── article/          # 文章相关 API
│   │   ├── author/           # 作者相关 API
│   │   ├── category/         # 分类相关 API
│   │   ├── comment/          # 评论相关 API
│   │   ├── health/           # 健康检查 API
│   │   ├── like/             # 点赞相关 API
│   │   ├── subscriber/       # 订阅者相关 API
│   │   │   ├── services/     # 订阅服务
│   │   │   │   ├── email-service.ts
│   │   │   │   ├── email-templates.ts
│   │   │   │   ├── resend-service.ts
│   │   │   │   └── subscriber-service.ts
│   │   └── tag/              # 标签相关 API
│   ├── components/           # 共享组件
│   ├── extensions/           # Strapi 扩展
│   ├── plugins/              # 自定义插件
│   │   └── email-resend/     # Resend 邮件插件
│   ├── utils/                # 工具函数
│   │   └── logger.ts         # 日志工具
│   └── index.ts              # 应用入口文件
├── tests/                    # 测试文件
│   ├── api/                  # API 测试
│   │   ├── article.test.ts
│   │   ├── health.test.ts
│   │   └── subscriber.test.ts
│   ├── helpers/              # 测试辅助工具
│   │   └── api-client.ts     # API 请求客户端
│   └── setup/                # 测试配置
│       ├── global-setup.ts   # 全局测试设置
│       └── global-teardown.ts # 全局测试清理
├── types/                     # TypeScript 类型定义
│   └── generated/            # Strapi 生成的类型
├── .env.example              # 环境变量示例文件
├── docker-compose.yml       # Docker Compose 配置
├── Dockerfile               # Docker 镜像定义
├── jest.config.ts           # Jest 测试配置
├── package.json             # 项目依赖和脚本
├── render.yaml              # Render 部署配置
├── tsconfig.json            # TypeScript 配置
├── tsconfig.test.json       # 测试 TypeScript 配置
└── zeabur.json              # Zeabur 部署配置
```

## 📚 API 文档

### 健康检查

#### GET /api/health

检查服务健康状态。

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 订阅者 API

#### POST /api/subscribers/subscribe

创建新的订阅。

**请求体：**
```json
{
  "email": "user@example.com",
  "name": "用户名称"
}
```

**响应示例：**
```json
{
  "message": "订阅请求已创建，请检查邮箱确认",
  "requiresConfirmation": true,
  "subscriber": {
    "id": 1,
    "email": "user@example.com",
    "name": "用户名称",
    "confirmed": false
  }
}
```

#### POST /api/subscribers/unsubscribe

取消订阅。

**请求体：**
```json
{
  "email": "user@example.com"
}
```

#### GET /api/subscribers/count

获取订阅者总数。

**响应示例：**
```json
{
  "count": 100
}
```

#### GET /api/subscribe/confirm

确认订阅（通过邮件链接访问）。

**查询参数：**
- `token`: 确认令牌

### 文章 API

所有文章相关的 API 遵循 Strapi 标准 REST API 规范：

- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取单篇文章
- `POST /api/articles` - 创建文章（需要认证）
- `PUT /api/articles/:id` - 更新文章（需要认证）
- `DELETE /api/articles/:id` - 删除文章（需要认证）

### GraphQL API

项目集成了 GraphQL 插件，可以通过 `/graphql` 端点访问 GraphQL API。

访问 GraphQL Playground：`http://localhost:1337/graphql`

## 🔧 常见问题

### 数据库连接问题

如果遇到数据库连接问题：

1. 检查 `DATABASE_URL` 或数据库配置是否正确
2. 确认数据库服务是否运行
3. 检查防火墙和网络设置
4. 对于 PostgreSQL，确认 SSL 配置是否正确

### 邮件发送失败

如果邮件发送失败：

1. 检查 `RESEND_API_KEY` 是否正确配置
2. 确认 Resend 账户状态正常
3. 检查 `EMAIL_FROM` 配置的域名是否已验证

### 权限问题

如果在访问 API 时遇到权限问题：

1. 检查 Strapi 管理面板中的权限设置
2. 确认 Public 角色的权限已正确配置
3. 检查 API Token 是否正确配置（如果需要认证）

## 📝 许可证

本项目为私有项目。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📞 联系方式

如有问题，请通过 Issue 联系。
