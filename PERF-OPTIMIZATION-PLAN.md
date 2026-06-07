# 首页编译性能优化计划

## 问题

本地 `pnpm dev` 启动后首次访问首页耗时长，主要卡在：
1. 外部 API 瀑布式请求（2N+2 次）
2. CJK 字体下载 + 子集化
3. 开发模式下无缓存，每次刷新重复全部请求

## 现状量化

`getAllArticles()` 对 N 篇文章发出：
- 1 次 `articles.json` (R2)
- N 次 `getLikes()` → `getReactions()` 逐篇调用 emaction
- 1 次 `getBatchViews()` (Webviso 批量)
- N 次 `getBatchCommentCounts()` 逐篇 fetch 评论数

首页额外：`DailyNews` → `getArticlesByCategory()` → 复用 `getAllArticles()`（cache 命中）

---

## Phase 1 — API 调用批量化（消除 2N 次请求）

**目标**：将 O(N) 请求降为 O(1)

### 1.1 emaction 点赞批量获取

`lib/services.ts` 新增 `getBatchLikes(ids: string[])`：
- 方案 A：emaction 支持多 targetId 查询 → 1 次请求
- 方案 B：emaction 无批量 API → 并发请求但加超时控制 + 失败快速返回
- 方案 C：首页跳过点赞数，仅在文章详情页获取（推荐）

**推荐方案 C**：首页列表展示点赞数意义不大，`getAllArticles()` 中移除点赞获取逻辑，改为文章详情页单独获取。

### 1.2 评论数批量获取

`lib/blog-data.ts` 的 `getBatchCommentCounts` 改造：
- 方案 A：cf-comment 是否支持批量查询 → 确认后改造
- 方案 B：首页跳过评论数，详情页单独获取（推荐）
- 方案 C：构建时写入 articles.json 的 commentCount 字段（需 Worker 配合）

**推荐方案 B**：与点赞相同策略，首页不获取评论数。

### 1.3 改造后 getAllArticles 请求量

```
改造前：1 (articles) + N (likes) + 1 (views) + N (comments) = 2N + 2
改造后：1 (articles) + 1 (views) = 2
```

### 涉及文件

- `lib/blog-data.ts` — `getAllArticles()` 移除 likes/comments 获取
- `lib/services.ts` — 保留 `getLikes` / `getBatchCommentCounts`，供详情页使用
- `components/article/ArticleDetailClient.tsx` 或详情页 server component — 添加单篇文章的 likes/comments 获取

---

## Phase 2 — 开发模式降级（即时生效）

**目标**：开发模式下跳过外部 API 调用

### 2.1 环境感知数据获取

`lib/blog-data.ts` 的 `getAllArticles()` 中，动态数据获取（views/likes/comments）添加环境判断：

```ts
const isDev = process.env.NODE_ENV === 'development';
```

开发模式下：
- views: 使用随机占位数或 0
- likes: 跳过
- comments: 跳过

### 2.2 开发模式字体加速

`app/[locale]/layout.tsx` 的 4 个 Google 字体，开发模式下可降级：
- 方案 A：开发模式使用 `font-family: system-ui` 跳过 next/font
- 方案 B：保持不变，字体有磁盘缓存后首次之后不慢

**推荐方案 B**：字体只在首次编译慢，后续有缓存。

### 涉及文件

- `lib/blog-data.ts` — 添加 `NODE_ENV` 判断

---

## Phase 3 — 首页数据流优化（减少重复计算）

**目标**：消除 DailyNews 的独立数据获取

### 3.1 DailyNews 接收 props 而非自行获取

当前 `DailyNews` 调用 `getArticlesByCategory('daily-news')`，内部走 `getAllArticles()` 再 filter。

改造为：`page.tsx` 中已获取 `allArticles`，直接 filter 后传给 `DailyNews`。

```tsx
// page.tsx
const dailyNewsArticles = allArticles.filter(a => a.category.slug === 'daily-news');
// ...
<DailyNews articles={dailyNewsArticles} />
```

### 涉及文件

- `app/[locale]/page.tsx` — 预 filter daily-news 文章
- `components/home/DailyNews.tsx` — 改为接收 `articles` prop

---

## Phase 4 — 字体长期优化（可选）

**目标**：消除 Google Fonts 网络依赖

### 4.1 本地字体文件

- 下载 Noto Serif SC / Noto Sans SC 的 woff2 子集化文件
- 使用 `next/font/local` 替代 `next/font/google`
- 消除编译时下载依赖

### 涉及文件

- `app/[locale]/layout.tsx` — 改用 `next/font/local`
- `public/fonts/` — 存放字体文件

---

## 执行顺序与预估

| Phase | 内容 | 预估耗时 | 首页请求量变化 |
|-------|------|----------|---------------|
| 1 | 移除首页 likes/comments 获取 | 30 min | 2N+2 → 2 |
| 2 | 开发模式降级 | 15 min | dev: 2 → 1 |
| 3 | DailyNews props 传递 | 15 min | 无变化，减少 cache 查询 |
| 4 | 本地字体（可选） | 1-2 hr | 无变化，消除编译时下载 |

**总计**：Phase 1-3 约 1 小时，可立即执行。Phase 4 视需求决定。

## NOT in scope

- emaction / cf-comment 添加批量 API（后端改造）
- Worker 同步时预计算 likes/views/comments（架构变更过大）
- Turbopack 配置调优（Next.js 16 默认使用，无需手动配置）
- ISR 缓存策略调整（生产环境已有，仅开发模式受影响）
