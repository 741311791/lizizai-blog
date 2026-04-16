# 李自在博客 (Zizai Blog)

基于 Next.js 16 的中文博客平台，使用飞书文档作为 CMS，部署在 Vercel + Cloudflare 边缘网络。

## 架构概览

```
飞书文档 ──→ 同步 Worker (Cloudflare Workers) ──→ R2 存储 (CDN)
                                                      │
                                                      ↓
用户 ──→ Next.js (Vercel, ISR) ──→ R2 读取内容
         │
         ├── emaction (点赞)      ── Cloudflare D1
         ├── Webviso (浏览计数)    ── Cloudflare Workers + D1
         ├── cf-comment (评论系统) ── Cloudflare Workers + D1
         ├── Counterscale (分析)   ── Cloudflare Workers + D1
         └── Resend (邮件订阅)     ── 第三方 API
```

**核心理念**：无服务器架构，内容在飞书编写，通过 Worker 同步到 R2，前端纯静态渲染 + ISR。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router), React 19 |
| 样式 | Tailwind CSS v4 (OKLCH), shadcn/ui |
| 语言 | TypeScript 5 |
| 内容管理 | 飞书文档 API |
| 存储 | Cloudflare R2 |
| 同步服务 | Cloudflare Workers |
| 评论/点赞/计数 | Cloudflare Workers + D1 |
| 邮件 | Resend |
| 搜索 | Pagefind (构建时索引) |
| 部署 | Vercel (ISR, 每小时重新验证) |

## 项目结构

```
app/                              # Next.js App Router 页面
├── admin/                        # 后台管理（密码保护）
├── article/[slug]/               # 文章详情页
├── category/[slug]/              # 分类页
├── archive/                      # 归档页
├── subscribe/                    # 邮件订阅
├── api/admin/                    # 管理员 API（认证、同步）
└── api/subscribe/                # 邮件订阅 API

components/
├── article/                      # 文章相关组件（卡片、内容、评论、TOC）
├── home/                         # 首页组件（Hero、热门文章、关于我）
├── layout/                       # 布局组件（Header、Footer）
├── share/                        # 社交分享菜单
└── ui/                           # shadcn/ui 基础组件

lib/
├── blog-data.ts                  # 核心数据层（从 R2 读取）
├── services.ts                   # Cloudflare 服务 API 客户端
├── seo.ts                        # SEO 元数据生成
└── env.ts                        # 环境变量配置

workers/feishu-blog-sync/         # 飞书同步 Worker
├── src/index.ts                  # HTTP 入口 + 定时触发
├── src/feishu.ts                 # 飞书 API 客户端
├── src/converter.ts              # 飞书文档 → Markdown 转换
└── src/sync.ts                   # 同步逻辑
```

## 功能特色

### 内容管理
- **飞书即 CMS**：在飞书中编写文档，自动同步为博客文章
- **自动同步**：每日凌晨 3 点自动同步，或通过后台手动触发
- **图片处理**：飞书文档中的图片自动下载到 R2 CDN
- **Markdown 转换**：飞书块级文档自动转为标准 Markdown

### 文章阅读
- **ISR 静态生成**：页面预渲染，1 小时缓存刷新
- **目录导航**：自动生成文章目录（TOC）
- **代码高亮**：支持多种编程语言语法高亮
- **阅读时间**：自动计算文章阅读时长
- **相关推荐**：基于分类的相关文章推荐

### 社交互动
- **评论系统**：每篇文章独立评论区，支持嵌套回复、点赞
- **点赞功能**：每篇文章独立点赞计数
- **浏览计数**：实时页面浏览统计
- **社交分享**：支持分享到 Facebook、LinkedIn、Bluesky、X 等平台

### 后台管理
- **密码保护**：`/admin` 路由，密码验证后进入管理面板
- **一键同步**：手动触发飞书文档同步
- **自动创建评论区**：新文章同步后自动创建对应评论区

### SEO 与性能
- **完整 SEO**：元数据、JSON-LD 结构化数据、Sitemap、Robots.txt
- **Pagefind 搜索**：构建时生成搜索索引，无需后端
- **深色模式**：默认深色主题，OKLCH 色彩空间
- **响应式设计**：适配桌面和移动端

## 内容流转流程

```
1. 作者在飞书中编写/编辑文档
2. 同步 Worker 读取飞书 API：
   - 获取文件夹中的所有文档
   - 提取文档内容（标题、正文、图片）
   - 转换飞书块为 Markdown
   - 下载图片到 R2
3. 生成结构化数据存入 R2：
   - blog-data/articles.json      # 文章列表
   - blog-data/categories.json    # 分类列表
   - blog-data/articles/{category}/{slug}/content.md  # 文章内容
4. Next.js 通过 ISR 渲染页面：
   - lib/blog-data.ts 从 R2 读取数据
   - 生成静态 HTML
   - 每小时自动重新验证
```

## 快速开始

### 环境要求

- Node.js 18+
- pnpm

### 安装

```bash
git clone https://github.com/your-repo/lizizai-blog.git
cd lizizai-blog
pnpm install
```

### 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
# 网站
NEXT_PUBLIC_SITE_URL=https://lizizai.xyz

# R2 存储（飞书 CMS 数据源）
R2_PUBLIC_URL=https://your-r2-public-url

# 飞书同步服务
NEXT_PUBLIC_SYNC_URL=https://your-sync-worker/sync
NEXT_PUBLIC_SYNC_TOKEN=your-sync-token

# Cloudflare 服务
NEXT_PUBLIC_EMACTION_URL=https://like.your-domain.xyz
NEXT_PUBLIC_WEBVISO_URL=https://view.your-domain.xyz
NEXT_PUBLIC_CF_COMMENT_URL=https://comment.your-domain.xyz
NEXT_PUBLIC_COUNTERSCALE_URL=https://analytics.your-domain.xyz

# 邮件（Resend）
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@your-domain.com

# 后台管理
ADMIN_PASSWORD=your-admin-password
CF_COMMENT_PASSWORD=your-cf-comment-admin-password
```

### 开发

```bash
pnpm dev        # 启动开发服务器 (http://localhost:3000)
pnpm build      # 生产构建
pnpm lint       # 代码检查
```

## 部署

### 前端 (Vercel)

1. 将仓库连接到 Vercel
2. 配置上述环境变量
3. 推送到 `main` 分支自动部署

### 同步 Worker (Cloudflare Workers)

```bash
cd workers/feishu-blog-sync
pnpm install
npx wrangler secret put FEISHU_APP_ID
npx wrangler secret put FEISHU_APP_SECRET
npx wrangler secret put FEISHU_FOLDER_TOKEN
npx wrangler secret put SYNC_TOKEN
npx wrangler deploy
```

Worker 配置详情见 `workers/feishu-blog-sync/wrangler.toml`。

## 写作流程

1. 在飞书中创建或编辑文档
2. 文档会按以下方式自动同步：
   - **自动**：每日凌晨 3 点定时同步
   - **手动**：访问 `/admin` → 输入密码 → 点击"同步飞书文档"
3. 同步完成后，ISR 缓存将在 1 小时内更新页面

## 许可

MIT
