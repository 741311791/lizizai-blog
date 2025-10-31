# lizizai-blog - 全栈博客平台

这是一个使用 Next.js 和 Strapi 构建的现代化、高性能的全栈博客平台。项目采用前后端分离的 Monorepo 架构，集成了内容管理、用户认证、邮件订阅和社区讨论等丰富功能。

## 技术栈 (Tech Stack)

| 分类 | 技术 | 描述 |
| --- | --- | --- |
| **前端** | Next.js (v16+) | 基于 React 的全栈框架，使用 App Router。 |
| | React (v19+) | 用于构建用户界面的核心库。 |
| | TypeScript | 提供静态类型检查，增强代码健壮性。 |
| | Tailwind CSS | 功能类优先的 CSS 框架，用于快速构建自定义界面。 |
| | shadcn/ui | 基于 Radix UI 和 Tailwind CSS 的可复用组件库。 |
| | Zustand & React Context | 用于前端状态管理。 |
| **后端** | Strapi (v5) | 领先的开源 Headless CMS，用于内容管理和 API 服务。 |
| | Koa.js | Strapi 底层使用的 Node.js 框架。 |
| | TypeScript | 后端同样采用 TypeScript 开发。 |
| **数据库** | PostgreSQL, SQLite | 生产环境使用 PostgreSQL，本地开发使用 SQLite。 |
| **部署** | Vercel, Docker, Render | 前端优化于 Vercel 部署，后端支持 Docker 和 Render。 |

## 项目亮点

- **现代化架构:** 采用 Next.js App Router 和 Strapi v5，充分利用最新框架特性，如 ISR (增量静态再生)。
- **全功能实现:** 包含文章、分类、评论、订阅、用户认证等完整的博客生态功能。
- **高质量代码:** 全面使用 TypeScript，代码结构清晰，模块化程度高，遵循最佳实践。
- **灵活部署:** 为前后端提供多种部署方案 (Vercel, Render, Docker)，适应不同环境需求。
- **邮件系统集成:** 集成 Resend 服务，实现用户订阅后的自动化邮件发送。

## 项目结构

项目采用 Monorepo 结构，将前后端代码分别管理在独立的目录中。

```
lizizai-blog/
├── backend/      # Strapi 后端应用
│   ├── config/     # Strapi 配置
│   ├── src/api/    # 内容类型 API
│   └── README.md   # 后端详细部署指南
│
├── frontend/     # Next.js 前端应用
│   ├── app/        # App Router 页面和路由
│   ├── components/ # React 组件
│   ├── lib/        # 工具函数和 API 客户端
│   └── README.md   # 前端详细部署指南
│
└── README.md     # 项目主 README
```

## 本地开发入门

**环境要求:**
- Node.js >= 18.0.0
- pnpm (推荐)

1.  **克隆仓库**

    ```bash
    git clone https://github.com/741311791/lizizai-blog.git
    cd lizizai-blog
    ```

2.  **安装后端依赖并启动**

    ```bash
    cd backend
    pnpm install
    pnpm develop
    ```

    后端服务将运行在 `http://localhost:1337`。首次启动请访问 `http://localhost:1337/admin` 创建管理员账户。

3.  **安装前端依赖并启动**

    ```bash
    cd ../frontend
    pnpm install
    pnpm dev
    ```

    前端开发服务将运行在 `http://localhost:3000`。

## 部署流程

本项目的前后端可独立部署。

- **前端部署:** 推荐使用 **Vercel** 进行一键部署，以获得最佳性能和体验。详细步骤请参考 [./frontend/README.md](./frontend/README.md)。

- **后端部署:** 推荐使用 **Render** 或 **Docker** 进行部署。详细步骤请参考 [./backend/README.md](./backend/README.md)。
