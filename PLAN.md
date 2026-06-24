# HTML 内容类型功能计划

## 概述

在 lizizai-blog 中新增第四种内容展示类型 `html`，与 `article`、`podcast`、`slides` 并列。HTML 文件存储在 R2，用户点击 HTML 类型标签后通过 iframe 渲染，使用 postMessage 动态同步高度。

## 已确认的设计决策（设计评审 2026-05-17）

| # | 决策 | 结论 |
|---|------|------|
| 1 | 布局宽度 | 全宽模式，突破 680px，移除 `max-w-3xl` |
| 2 | iframe 高度策略 | 方案 B：postMessage 动态高度，全量加载 HTML |
| 3 | 类型切换过渡 | 200ms opacity + max-width transition |
| 4 | 加载状态 | 骨架屏 500px + 脉冲动画 + "加载 HTML 内容..." 文案 |
| 5 | 超时兜底 | 5 秒超时 → 错误卡片 + "在新标签页打开" 按钮 |
| 6 | 移动端切换入口 | 头部下方 `lg:hidden` 横向类型条 |
| 7 | HTML 模式侧边栏 | 复用 ArticleSidebar |
| 8 | 图标选择 | lucide-react `Code2` |

## 已确认的工程决策（工程评审 2026-05-17）

| # | 决策 | 结论 |
|---|------|------|
| 1 | ContentType 扩展 | `types/index.ts` 加 `'html'` |
| 2 | ContentTypes.html 结构 | `{ htmlUrl: string; fileSize?: number }` |
| 3 | R2 存储路径 | `blog-data/articles/{category}/{slug}/html/index.html` |
| 4 | 数据层改动 | 仅构造 htmlUrl，不获取 HTML 内容 |
| 5 | Article 新增字段 | `htmlUrl?: string` |
| 6 | Worker 注入方式 | 延后到 Phase 4，前端先手动构造 URL |
| 7 | HtmlViewer 加载 | dynamic import + 100ms 节流 postMessage |
| 8 | 安全 | `sandbox="allow-scripts"` + origin 校验 + height clamp |
| 9 | 实现分 4 Phase | 类型+前端 → 数据层 → 移动端 → Worker |

## 数据流

```
飞书文档 → Worker 同步 → 识别 HTML 内容 → 注入 postMessage 脚本 → 写入 R2
                                                              ↓
用户点击 "HTML" 标签 → ArticleDetailClient 切换 → HtmlViewer 组件渲染 iframe
                                                              ↓
iframe 加载 R2 HTML → postMessage 通知父页面高度 → 父页面动态调整 iframe 高度
```

## 涉及文件

### 类型定义
- `types/index.ts` — ContentType 加 `'html'`，ContentTypes 加 `html` 字段，Article 加 `htmlUrl`

### 前端组件
- `components/article/ContentTypeSwitcher.tsx` — 加 html 选项 + Code2 图标
- `components/article/ContentTypeBadge.tsx` — 加 html badge 渲染
- `components/article/ArticleDetailClient.tsx` — renderMainContent/renderSidebar 加 html case + 移动端切换条
- `components/article/HtmlViewer.tsx` — **新建**，iframe + postMessage 监听 + 安全沙箱 + 超时兜底

### 数据层
- `lib/blog-data.ts` — getArticleBySlug 中构造 htmlUrl

### 国际化
- `messages/zh.json` — 加 html 相关翻译 key
- `messages/en.json` — 加 html 相关翻译 key

### Worker 同步（Phase 4）
- `workers/feishu-blog-sync/` — 识别 HTML 内容，注入 postMessage 脚本，写入 R2

## 安全策略

- iframe sandbox：`sandbox="allow-scripts"`（不开启 allow-same-origin）
- postMessage origin 校验 `e.origin === R2_URL`
- 高度值 clamp：`Math.max(200, Math.min(height, window.innerHeight * 2))`
- 超时兜底 5 秒
- 无 CSP 配置（后续补）

## 交互状态表

| FEATURE | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---------|---------|-------|-------|---------|---------|
| HTML iframe | 骨架屏 500px 脉冲动画 | 回退 ContentComingSoon | 错误卡片 + 重试 + 新标签页 | 正常渲染 | 超时兜底提示 |

## 边界情况

| 边界 | 处理 |
|------|------|
| HTML 404 | iframe onerror + 5s 超时 → 错误卡片 |
| 未注入 postMessage | 5s 超时 → 固定高度 80vh |
| postMessage 异常值 | clamp 到 [200, innerHeight*2] |
| 快速切换类型 | useEffect cleanup 移除监听器 |
| 移动端横屏 | max-width: 100vw |

## 实现顺序

```
Phase 1 — 类型系统 + 前端组件（~2 小时）
├── types/index.ts: ContentType + ContentTypes + Article.htmlUrl
├── ContentTypeSwitcher: 加 html 选项
├── ContentTypeBadge: 加 html badge
├── HtmlViewer.tsx: 新建（iframe + postMessage + 超时兜底）
├── ArticleDetailClient: 加 html case
└── i18n: zh/en 翻译

Phase 2 — 数据层（~30 分钟）
├── blog-data.ts: 构造 htmlUrl
└── 手动上传测试 HTML 到 R2 验证

Phase 3 — 移动端适配（~30 分钟）
└── ArticleDetailClient: 加 lg:hidden 移动端切换条

Phase 4 — Worker 同步（延后）
└── workers/feishu-blog-sync: 识别 + 注入 + 写入
```

## 移动端

- 侧边栏 `hidden lg:block` 在移动端隐藏
- 头部 meta-row 下方加 `lg:hidden` 移动端类型切换条
- iframe 全宽显示，iOS 加 `-webkit-overflow-scrolling: touch`

## NOT in scope

- 定制化 Agent Skill 生成 HTML 文件（记录在 TODOS.md）
- 共享 CSS 主题文件部署到 R2 CDN（Agent Skill 的前置依赖）
- CSP 配置（后续补）
- ArticleDetailClient switch 模式重构（5+ 类型时）

## 技术债

- ArticleDetailClient 的 switch 模式：每增加一种类型改两处。建议 5+ 类型时重构为策略模式
- 无 CSP 配置：应在 Next.js 中配置 Content-Security-Policy

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 5 issues, 0 critical, score: 4/10 → 7/10 |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ISSUES_OPEN | score: 2/10 → 8/10, 8 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** ENG + DESIGN CLEARED — ready to implement. Worker sync deferred to Phase 4.
