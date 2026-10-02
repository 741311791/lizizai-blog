# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

lizizai-blog 是一个中文博客平台：Next.js 16 (App Router) + 飞书 CMS + Cloudflare 边缘服务。默认深色模式。部署在 Vercel + Cloudflare Workers。支持中英双语（next-intl）、多内容类型（文章/播客/幻灯片/HTML 嵌入）与 RSS 订阅。

## Commands

```bash
pnpm dev          # Dev server on :3000
pnpm build        # 生产构建（next build --webpack，见下方构建说明）
pnpm lint         # ESLint（eslint）
```

**构建说明**：`build` 脚本强制使用 `--webpack` 而非 Turbopack——`next/font/google` 的中文字体在 Turbopack 下会导致构建失败，必须降级 webpack。修改构建配置时勿切回 Turbopack。

`postbuild` 自动运行 Pagefind 生成搜索索引，输出到 `public/pagefind`。

测试（无测试框架，用 tsx 直接跑）：

```bash
npx tsx lib/__tests__/blog-data.test.ts          # 前端数据层测试

# 同步 Worker（独立 pnpm 项目，位于 workers/feishu-blog-sync/）
cd workers/feishu-blog-sync && pnpm sync         # 本地手动跑同步（npx tsx src/cli.ts，需飞书+R2 凭证）
cd workers/feishu-blog-sync && npx tsc --noEmit  # Worker 类型检查
```

**生产同步触发**（重要）：同步已从 Worker CRON 迁移到 **GitHub Actions**（`.github/workflows/feishu-sync.yml`）。Worker 代码保留但 `wrangler.toml` 的 triggers 已注释，不再用 CRON。

```bash
# 手动触发生产同步（增量）
gh workflow run feishu-sync.yml --ref main
# 手动触发全量同步（传 force_sync=true）
gh workflow run feishu-sync.yml -f force_sync=true --ref main
# 查看同步历史
gh run list --workflow=feishu-sync.yml --limit=5
```

定时 schedule 为 `0 1 * * *`（UTC 01:00 = 北京 09:00），但 GitHub Actions cron **常滞后数小时**，紧急更新请用 `workflow_dispatch` 手动触发。

## Architecture

### 数据流

**所有内容（含 Daily News 分类下的 AI 日报）统一数据流**：

```
飞书文档/文件 → GitHub Actions 同步 → R2 存储 (articles.json + 每篇 meta/content/资源)
                                      ↓
用户 → Next.js (Vercel, ISR revalidate 3600s) → 读 R2
```

daily-news 是普通分类，数据来自 R2 `articles.json`，无独立 API route。

### 数据层

`lib/blog-data.ts` 为**唯一**数据访问层：从 R2 获取文章 JSON，聚合 emaction 点赞 + Webviso 浏览量 + cf-comment 评论数。（历史上的本地 MDX 数据层 `lib/content.ts` + `content/` 已于 2026-10-01 删除，勿再引用）

### 内容类型与飞书文件夹结构

`ContentType = 'article' | 'podcast' | 'slides' | 'html'`（`types/index.ts`）。飞书侧有两种文章形态：

**1. 单文档文章**（旧格式）：根目录或分类目录下的单个飞书 docx，`modified_time` 增量检测。

**2. 多内容类型文件夹**（blogFolder）：一个以文章标题命名的文件夹，内含按内容类型组织的子文件夹。同步器（`syncBlogFolder`）扫描子文件夹名识别类型：

| 子文件夹名 | 内容类型 | 说明 |
|-----------|---------|------|
| `文章` / `article` | article | 必选，主文章 docx + 可选 `cover.{png,jpg,webp}` |
| `播客` / `podcast` | podcast | 同名文件组（音频 + 封面 + 文字稿） |
| `PPT` / `ppt` | slides | HTML 幻灯片（index.html + slides/ + shared/） |
| `html` | html | 独立 HTML 文件（lizizai-html 规范） |

命名严格匹配（大小写敏感），新增内容类型需同步更新 `FOLDER_NAMES` 常量与 `subFolderTypeOf`。

### 同步机制（`workers/feishu-blog-sync/src/sync.ts`）

- **增量检测**：多内容类型文件夹用「各类型独立高水位」策略——`meta.json` 的 `contentTypes.syncCheckpoints` 记录每种类型上次观测到的最大 `modified_time`，任一类型有更新（含新增子文件夹）即触发同步。**不能用「子文件 mtime > 文章 mtime」作基准**——播客/PPT/HTML 晚于文章生成，mtime 天然偏大，会导致增量永久失效。
- **主类型优先级**：`html > slides > podcast`（HTML 为第一阅读类型）。同步后 `meta.contentType` 设为优先级最高的可用类型，前端据此默认展示。
- **失败隔离**：播客/PPT/HTML 同步失败不阻塞文章（try/catch 吞错并 console.error）。
- **产物**：每篇文章在 R2 的 `articles/{categorySlug}/{slug}/` 下存 `meta.json` + `content.md` + 各类型资源（`podcast/`、`slides/`、`html/index.html`、`images/`）。
- **HTML 同步**（`syncHtmlFolder`）：主文件选取优先级 `index.html` > 与 slug 同名 > 唯一/首个 html，统一存为 `html/index.html` 供 iframe 渲染。

### HTML 内容类型架构（重点）

HTML 内容通过 iframe 嵌入展示，**目录由 HTML 自带**，不再跨 frame 同步：

- **生成**：用 `/lizizai-html` Skill 生成自包含 HTML（主题 CSS + Google Fonts + 高度同步脚本 + 内置浮动目录脚本），上传到飞书 blogFolder 的 `html` 子文件夹。
- **iframe 通信**：仅 `html-content-height` 一条 postMessage（父页面调高度自适应）。`sandbox="allow-scripts"`（无 `allow-same-origin`），故 HTML 无法被父页面访问 DOM。
- **目录**：HTML 内置浮动按钮 + 抽屉，`IntersectionObserver` 高亮。嵌入模式（iframe 高度=内容）下用户滚动父页面；**全屏模式**下 iframe 独立滚动，目录体验最佳。
- **前端**：`HtmlViewer` 仅处理高度同步 + 全屏按钮（Fullscreen API），不维护 TOC 状态。

### Key paths

- `app/[locale]/` — 所有本地化页面（en/zh），ISR 静态生成；**每个 layout/page 必须调 `setRequestLocale`**，否则全站 dynamic + Pagefind 搜索失效
- `app/[locale]/article/` — 文章详情页（`ArticleDetailClient` 按 contentType/contentTypes 渲染）
- `app/[locale]/daily-news/` — Daily News 分类页（复用分类页布局）
- `app/{feed,feed.xml}` — RSS 订阅（首页 + 分类级）
- `lib/blog-data.ts` — 核心数据层（R2）
- `lib/services.ts` — Cloudflare 服务客户端（emaction/Webviso）
- `lib/rss.ts` — RSS/Atom feed 生成（`FEED_CONTENT_TYPES` 控制纳入 feed 的类型）
- `components/article/` — `ContentTypeSwitcher`/`ContentTypeBadge`（多类型切换/标识）、`HtmlViewer`/`SlideViewer`/`AudioPlayer`（各类型查看器）
- `workers/feishu-blog-sync/` — 飞书同步代码（独立 pnpm 项目，生产由 GitHub Actions 跑 `src/cli.ts`）
- `templates/ai-daily/template.html` — AI 日报 HTML 模板（内置目录脚本，配合 `/ai-daily-extract` + `/lizizai-html`）
- `.claude/skills/` — `lizizai-html`（HTML 主题生成）、`ai-daily-extract`（日报数据提取）
- `types/index.ts` — TypeScript 类型（Article/ContentType/ContentTypes）

### 国际化 (i18n)

- next-intl，默认 locale `en`，中文路径 `/zh`；`localePrefix: 'as-needed'`（默认语言不带前缀）
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

博客前端不直连 D1；评论/点赞/浏览量各服务在其后端使用各自的 D1，通过 `NEXT_PUBLIC_*_URL` 调用。

### Styling

- Tailwind CSS v4（OKLCH color space, CSS custom properties）
- shadcn/ui（new-york style），Dark mode only（`<html className="dark">`）

### Environment variables

- `NEXT_PUBLIC_SITE_URL` — 网站 URL
- `R2_PUBLIC_URL` — R2 CDN 地址（前端读此拉取 articles.json/content）
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — Resend 邮件
- `NEXT_PUBLIC_EMACTION_URL` / `NEXT_PUBLIC_WEBVISO_URL` / `NEXT_PUBLIC_CF_COMMENT_URL` / `NEXT_PUBLIC_COUNTERSCALE_URL` — 各边缘服务
- `ADMIN_PASSWORD` — 后台管理密码

GitHub Actions 同步额外用的 secrets（`FEISHU_APP_SECRET`、`R2_*` 凭证、`FEISHU_FOLDER_TOKEN`）见 `.github/workflows/feishu-sync.yml`。最小配置见 `.env.example`。

## Important conventions

- 语言：所有 UI 文本和代码注释使用中文 (zh-CN)
- Server Components 默认，Client Components 仅用于交互
- **不要主动执行 git commit/push**，除非用户明确要求
- ISR revalidate：页面（文章/列表/分类/标签/feed/sitemap）统一 3600s；浏览量与点赞为客户端直连各服务（无服务端缓存），紧急更新走 `/api/revalidate` 全量清除
- 内容更新链路：飞书编辑 → GitHub Actions 同步 → R2 → ISR 自动更新（紧急用手动 workflow_dispatch）
- 新增 ContentType 需同步：`types/index.ts` + `sync.ts`（FOLDER_NAMES/syncXxxFolder）+ `lib/rss.ts`（FEED_CONTENT_TYPES）+ 渲染组件
- HTML 内容必须符合 `/lizizai-html` 规范（主题 CSS + 字体 + 高度同步 + 内置目录四要素），否则 iframe 渲染异常

## Skills

- `/lizizai-html` — 生成与博客设计系统一致的独立 HTML 文件（iframe 嵌入用）。产物含主题 CSS（R2 CDN）、Google Fonts、高度同步 postMessage、内置浮动目录。规范见 `.claude/skills/lizizai-html/SKILL.md`
- `/ai-daily-extract` — AI 日报 Markdown → 结构化 JSON（供 `templates/ai-daily/template.html` 渲染）
- `/tech-blog-writer` — 技术博客写作流水线：事实素材包 → Gemini(gemini-2.5-flash) 生成 → 程序化质检（禁语/加粗/围栏/数字/编造）→ 修正落稿 → lark-cli 上传飞书分类 → 同步上线。含禁语清单、风格规则指针、分类 token、踩坑记录。规范见 `.claude/skills/tech-blog-writer/SKILL.md`

## Design System

Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
