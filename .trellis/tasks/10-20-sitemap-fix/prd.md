# sitemap 补路径与真实 lastModified

**优先级**:P1 | **类型**:fix/SEO | **创建**:2026-10-20

## 背景

`app/sitemap.ts` 两个问题：

1. **路径遗漏**：`staticPaths`（app/sitemap.ts:14）缺 `/daily-news`（核心分类页，已接 Substack 订阅）与 `/resume`（公开页面）。
2. **lastModified 失真**：静态页/分类页/标签页/feed 全部硬编码 `new Date()` → 每次生成都"刚刚更新"，稀释搜索引擎对 lastModified 信号的信任。

## Requirements

- `staticPaths` 补入 `/daily-news`、`/resume`（daily-news priority 0.9 对齐分类页；resume 0.5，changeFrequency monthly）
- lastModified 真实化：
  - 分类页/标签页：取其下文章 `max(publishedAt)`
  - feed 条目：全量文章 `max(publishedAt)`（article/podcast feed 用各自过滤集的 max）
  - 静态页：保留 `new Date()`（其内容随发版变化，无数据源可依，可接受）
- 数据获取复用 `getAllArticles()`（React cache 请求级去重已覆盖，无额外 R2 请求）

## Acceptance Criteria

- [x] `curl localhost:3000/sitemap.xml` 包含 `/daily-news`、`/resume` 的 zh/en 两条
- [x] 分类/标签/feed 条目 lastModified 为真实文章时间，非当天时间戳
- [x] 改动文件 ESLint 零新增 error
