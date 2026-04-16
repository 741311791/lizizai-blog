# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

lizizai-blog 是一个中文博客平台：Next.js 16 (App Router) + 飞书 CMS + Cloudflare 边缘服务。默认深色模式。部署在 Vercel + Cloudflare Workers。

## Commands

```bash
pnpm dev          # Dev server on :3000
pnpm build        # Production build (含 Pagefind 搜索索引)
pnpm lint         # ESLint
```

## Architecture

飞书文档 → Worker 同步 → R2 存储 → Next.js ISR 渲染

### Key paths

- `app/` — App Router 页面，ISR 静态生成
- `app/admin/` — 密码保护的后台管理页面
- `app/api/admin/` — 管理员 API（认证、同步）
- `app/api/subscribe/` — 邮件订阅 API route (Resend SDK)
- `lib/blog-data.ts` — 核心数据层，从 R2 读取文章数据
- `lib/services.ts` — Cloudflare 服务 API 客户端（emaction/Webviso/cf-comment）
- `lib/env.ts` — 环境变量
- `components/` — React 组件（shadcn/ui + 自定义）
- `workers/feishu-blog-sync/` — 飞书文档同步 Worker
- `middleware.ts` — 路由中间件（admin 保护）
- `types/index.ts` — TypeScript 类型定义

### 动态功能

- 评论：cf-comment (Cloudflare Workers + D1)，每篇文章独立 area
- 点赞：emaction (Cloudflare D1)
- 浏览计数：Webviso (Cloudflare Workers + D1)
- 分析：counterscale (Cloudflare Workers + D1)
- 邮件：Resend SDK 直调
- 搜索：Pagefind（构建时生成索引）

### Styling

- Tailwind CSS v4 (OKLCH color space, CSS custom properties)
- shadcn/ui (new-york style)
- Dark mode only

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

## Important conventions

- 语言：所有 UI 文本和注释使用中文 (zh-CN)
- 内容更新：飞书编辑 → 同步 Worker → R2 → ISR 自动更新
- 同步触发：自动每日 3AM / 手动 `/admin` 后台
- Server Components 默认，Client Components 仅用于交互
- 代码注释始终使用中文
- 不要主动执行 git commit/push，除非用户明确要求
