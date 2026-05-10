# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

lizizai-blog 是一个中文博客平台：Next.js 16 (App Router) + 飞书 CMS + Cloudflare 边缘服务。默认深色模式。部署在 Vercel + Cloudflare Workers。支持中英双语（next-intl）。

## Commands

```bash
pnpm dev          # Dev server on :3000
pnpm build        # Production build
pnpm lint         # ESLint
```

构建后自动运行 Pagefind 生成搜索索引（`postbuild` 脚本，输出到 `public/pagefind`）。

## Architecture

### 数据流

**博客内容**：飞书文档 → Worker 同步 (每日 3AM CRON) → R2 存储 → Next.js ISR 渲染 (revalidate 3600s)

**AI 资讯**：外部服务采集 → Cloudflare D1 → Next.js API route 读取 → 首页 + `/ai-news` 归档页渲染

### 双数据层

项目存在两套数据访问层，**生产环境使用 R2 版本**：

- `lib/blog-data.ts` — **生产用**：从 R2 获取文章 JSON，聚合 emaction 点赞 + Webviso 浏览量 + cf-comment 评论数
- `lib/content.ts` — **遗留/备用**：从本地 `content/` 目录读取 MDX + YAML，开发调试可用

### Key paths

- `app/[locale]/` — 所有本地化页面（en/zh），ISR 静态生成
- `app/[locale]/article/` — 文章详情页
- `app/[locale]/ai-news/` — AI 资讯归档页
- `app/api/` — API routes（admin 认证/同步、subscribe 邮件订阅、ai-news 资讯）
- `lib/blog-data.ts` — 核心数据层（R2）
- `lib/services.ts` — Cloudflare 服务客户端（emaction/Webviso）
- `lib/ai-news.ts` — AI 资讯数据读取（D1）
- `lib/seo.ts` — SEO 元数据生成
- `lib/env.ts` — 环境变量 + D1 配置
- `components/` — React 组件（shadcn/ui + 自定义）
- `components/ui/` — shadcn/ui 基础组件
- `workers/feishu-blog-sync/` — 飞书文档同步 Worker（独立 pnpm 项目）
- `types/index.ts` — TypeScript 类型定义（Article, AiNews 等）
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
| AI 资讯 | 外部采集写入 D1 | Cloudflare D1 |

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
- `CF_ACCOUNT_ID` / `CF_D1_DATABASE_ID` / `CF_D1_API_TOKEN` — D1（AI 资讯数据源）
- `ADMIN_PASSWORD` — 后台管理密码
- `CF_COMMENT_PASSWORD` — cf-comment 管理员密码

### Worker（飞书同步）

位于 `workers/feishu-blog-sync/`，独立项目。CRON 每日 3AM 触发，读取飞书文档写入 R2 bucket `lizizai-blog`。Secrets（`FEISHU_APP_SECRET`、`SYNC_TOKEN`）通过 `wrangler secret put` 设置。

## Important conventions

- 语言：所有 UI 文本和注释使用中文 (zh-CN)
- 内容更新：飞书编辑 → 同步 Worker → R2 → ISR 自动更新
- Server Components 默认，Client Components 仅用于交互
- 代码注释始终使用中文
- 不要主动执行 git commit/push，除非用户明确要求
- ISR revalidate：文章列表/分类 3600s，浏览量 300s，点赞 60s

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
