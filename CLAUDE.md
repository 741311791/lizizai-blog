# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

lizizai-blog 是一个中文博客平台：Next.js 16 (App Router) + 飞书 CMS + Cloudflare 边缘服务。默认深色模式。部署在 Vercel + Cloudflare Workers。支持中英双语（next-intl）、多内容类型（文章/播客/幻灯片/HTML 嵌入）与 RSS 订阅。

## Commands

```bash
pnpm dev          # Dev server on :3000
pnpm build        # Production build
pnpm lint         # ESLint
```

构建后自动运行 Pagefind 生成搜索索引（`postbuild` 脚本，输出到 `public/pagefind`）。

测试（无测试框架，用 tsx 直接跑）：

```bash
npx tsx lib/__tests__/blog-data.test.ts          # 前端数据层测试
cd workers/feishu-blog-sync && pnpm sync         # 手动触发飞书→R2 同步（npx tsx src/cli.ts）
cd workers/feishu-blog-sync && pnpm dev          # Worker 本地 dev
cd workers/feishu-blog-sync && pnpm deploy       # Worker 部署
```

## Architecture

### 数据流

**所有内容（含 Daily News 分类下的 AI 日报）统一数据流**：飞书文档 → Worker 同步 (每日 3AM CRON) → R2 存储 → Next.js ISR 渲染 (revalidate 3600s)。daily-news 是普通分类，数据来自 R2 `articles.json`，无独立 API route。

### 双数据层

项目存在两套数据访问层，**生产环境使用 R2 版本**：

- `lib/blog-data.ts` — **生产用**：从 R2 获取文章 JSON，聚合 emaction 点赞 + Webviso 浏览量 + cf-comment 评论数
- `lib/content.ts` — **遗留/备用**：从本地 `content/` 目录读取 MDX + YAML，开发调试可用

### 内容类型（ContentType）

`types/index.ts` 定义 `ContentType = 'article' | 'podcast' | 'slides' | 'html'`，对应飞书侧不同文档形态，均经 Worker 同步入 R2。新增类型需同步更新 `lib/rss.ts`（`FEED_CONTENT_TYPES`）与渲染组件。

### Key paths

- `app/[locale]/` — 所有本地化页面（en/zh），ISR 静态生成
- `app/[locale]/article/` — 文章详情页
- `app/[locale]/daily-news/` — Daily News 分类页（复用分类页布局）
- `app/[locale]/{about,archive,category,tag,privacy,terms,subscribe}` — 其他页面
- `app/admin/` — 后台管理页面
- `app/api/` — API routes（subscribe 邮件订阅、admin 认证/同步触发）
- `app/{feed,feed.xml}` — RSS 订阅（首页 + 分类级）
- `lib/blog-data.ts` — 核心数据层（R2）
- `lib/services.ts` — Cloudflare 服务客户端（emaction/Webviso）
- `lib/rss.ts` — RSS/Atom feed 生成
- `lib/store.ts` — 客户端状态（zustand）
- `lib/seo.ts` — SEO 元数据生成
- `lib/env.ts` — 环境变量配置
- `components/` — React 组件（shadcn/ui + 自定义）
- `components/ui/` — shadcn/ui 基础组件
- `workers/feishu-blog-sync/` — 飞书文档同步 Worker（独立 pnpm 项目）
- `templates/ai-daily/template.html` — AI 日报 HTML 模板（配合 `/lizizai-html` + `/ai-daily-extract`）
- `types/index.ts` — TypeScript 类型定义（Article, ContentType 等）
- `i18n/routing.ts` — 国际化路由配置
- `messages/zh.json`, `messages/en.json` — 翻译文件

### 国际化 (i18n)

- 使用 next-intl，默认 locale 为 `en`，中文路径 `/zh`
- `localePrefix: 'as-needed'` — 默认语言不带前缀
- 修改 UI 文本时需同时更新 `messages/zh.json` 和 `messages/en.json`

### 外部服务集成

| 功能 | 服务 | 数据存储 |
|------|------|----------|
| 评论 | cf-comment | Cloudflare D1 |
| 点赞 | emaction | Cloudflare D1 |
| 浏览计数 | Webviso | Cloudflare D1 |
| 分析 | counterscale | Cloudflare D1 |
| 邮件 | Resend SDK | — |
| 搜索 | Pagefind | 构建时静态索引 |

### Styling

- Tailwind CSS v4 (OKLCH color space, CSS custom properties)
- shadcn/ui (new-york style)
- Dark mode only（`<html className="dark">`）

### Environment variables

- `NEXT_PUBLIC_SITE_URL` — 网站 URL
- `R2_PUBLIC_URL` — R2 CDN 地址
- `NEXT_PUBLIC_SYNC_URL` / `NEXT_PUBLIC_SYNC_TOKEN` — 同步 Worker
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — Resend 邮件
- `NEXT_PUBLIC_EMACTION_URL` — 点赞服务
- `NEXT_PUBLIC_WEBVISO_URL` — 浏览计数服务
- `NEXT_PUBLIC_CF_COMMENT_URL` — 评论服务
- `NEXT_PUBLIC_COUNTERSCALE_URL` — 分析服务
- `ADMIN_PASSWORD` — 后台管理密码
- `CF_COMMENT_PASSWORD` — cf-comment 管理员密码

> 注：博客前端不直连 D1；评论/点赞/浏览量各服务在其后端使用各自的 D1，通过上面的 `NEXT_PUBLIC_*_URL` 调用。最小配置见 `.env.example`。

### Worker（飞书同步）

位于 `workers/feishu-blog-sync/`，独立项目。CRON 每日 3AM 触发，读取飞书文档写入 R2 bucket `lizizai-blog`。Secrets（`FEISHU_APP_SECRET`、`SYNC_TOKEN`）通过 `wrangler secret put` 设置。

## Important conventions

- 语言：所有 UI 文本和注释使用中文 (zh-CN)
- 内容更新：飞书编辑 → 同步 Worker → R2 → ISR 自动更新
- Server Components 默认，Client Components 仅用于交互
- 代码注释始终使用中文
- 不要主动执行 git commit/push，除非用户明确要求
- ISR revalidate：文章列表/分类 3600s，浏览量 300s，点赞 60s

## Skills

- `/lizizai-html` — 生成与博客设计系统一致的独立 HTML 文件（iframe 嵌入用）。主题 CSS 已部署到 R2 CDN
- `/ai-daily-extract` — AI 日报结构化数据提取（配合 `templates/ai-daily/`）

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
