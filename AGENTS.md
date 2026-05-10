# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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


<claude-mem-context>
# Memory Context

# [lizizai-blog] recent context, 2026-05-05 11:33am GMT+8

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (4,292t read) | 0t work

### May 4, 2026
S18 文章加粗文字样式优化 (May 4 at 11:03 PM)
S19 文章卡片组件性能优化 (May 4 at 11:04 PM)
S20 Claude-Mem Web 查看器无法访问问题排查 (May 4 at 11:07 PM)
S21 个人简介页面设计变体重新生成 (May 4 at 11:10 PM)
S22 Claude-Mem Web 查看器端口访问问题诊断 (May 4 at 11:18 PM)
116 11:19p 🔴 无法访问 Web 查看器界面
S23 Web 查看器界面访问问题诊断 (May 4 at 11:19 PM)
117 11:20p 🟣 李自在卷首语编辑界面
118 " 🟣 设计文件目录结构
119 " 🟣 个人介绍页面截图
120 " 🟣 设计文件归档
121 " 🟣 个人介绍页面 Variant C
122 11:21p 🔴 Web 查看器界面访问问题
S24 About 页面重新设计实现 (May 4 at 11:21 PM)
123 " 🟣 Web 设计变体截图功能
124 " ✅ 设计文件组织和管理
125 " 🟣 设计文件验证和确认
126 11:22p 🔵 设计变体 B 截图验证
127 11:24p 🔴 Claude-Mem Web 界面无法访问
128 " ✅ 设计审批状态记录
129 " ✅ 进入规划模式
130 11:25p 🔵 头像组件结构分析
131 " 🔵 关于页面现有结构分析
132 11:26p 🔵 完整的设计系统现状分析
133 11:27p ⚖️ 关于页面重新设计方案制定
134 11:28p ✅ 规划模式完成并提交方案
135 " ✅ 创建效果验证任务
136 " 🟣 任务管理系统建立
137 " 🔵 AboutMe 组件状态确认
138 11:29p 🟣 AboutMe 组件重构完成
139 " 🟣 任务状态更新与组件双重验证
140 " 🔵 中文国际化文件结构定位
141 " 🔵 当前中文国际化文本内容确认
142 " 🟣 中文国际化文本更新完成
143 11:30p 🟣 中文文本更新完成与任务状态推进
144 " 🔵 英文国际化文件结构定位
145 " 🔵 当前英文国际化文本内容确认
146 " 🟣 英文国际化文本更新完成
147 " 🟣 全部任务完成
148 11:31p 🔵 字体配置验证与设计规范确认
149 " 🔵 项目构建成功验证
151 11:32p 🟣 项目实施完成与验证通过
S25 博客项目构建状态检查与问题分析 (May 4 at 11:33 PM)
### May 5, 2026
152 9:41a 🔄 个人介绍模块布局优化
153 9:42a 🔵 个人介绍模块布局分析
154 9:43a 🔴 Claude-Mem Web界面无法访问
S26 博客AboutMe组件布局优化与间距调整 (May 5 at 9:43 AM)
155 10:05a ✅ 导航栏顺序调整
156 " 🔵 导航栏配置文件搜索
157 " 🔵 布局组件定位
158 " 🔵 导航栏配置模式分析
159 " 🔵 导航栏配置结构分析
160 " 🔵 国际化配置分析
161 " 🔵 中英文国际化配置对比
162 10:06a ✅ 导航栏顺序和标识调整
163 " ✅ 导航栏顺序和国际化配置完成
164 " ✅ 国际化配置JSON格式修正
165 " 🔵 遗留human3引用搜索
166 " ✅ 构建验证完成
S27 导航栏顺序调整和HUMAN 3.0重命名 (May 5 at 10:07 AM)
**Investigated**: 探索了项目中导航栏的实现结构，发现了Header.tsx和MobileNav.tsx中的NAV_LINKS配置数组，以及messages/zh.json和messages/en.json中的国际化翻译配置。通过搜索验证了没有其他文件引用旧的human3标签。

**Learned**: 导航栏使用NAV_LINKS数组配置，通过labelKey对应国际化翻译。项目采用Next.js + TypeScript + next-intl架构，支持中英文双语。构建验证机制确保修改的正确性。

**Completed**: 成功完成导航栏重排序：首页、每日资讯、AI、认知提升、精品课程、作品集、归档。将HUMAN 3.0重命名为认知提升（中文）和Cognitive Upgrades（英文），保留human3键确保向后兼容。修改了Header.tsx、MobileNav.tsx以及两个国际化文件，构建验证通过。

**Next Steps**: 导航栏修改已完成，构建验证通过，功能实现完整。
</claude-mem-context>