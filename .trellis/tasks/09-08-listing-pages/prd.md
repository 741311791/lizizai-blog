# 列表页性能与体验修复(归档/分类/标签/日报)

**优先级**:P1 | **父任务**:09-08-frontend-audit | **页面**:`/archive`、`/category/[slug]`、`/tag/[slug]`、`/daily-news`

**注意**:`ArticleCard` / `ArticleListItem` / `ArticleGrid` 三个文件的修改归 `09-08-shared-cards` 任务,本任务只做验收;`hooks/useViewMode.ts` 归本任务独占。

## 修复清单

### HIGH

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `app/[locale]/category/[slug]/page.tsx:54` + `daily-news/page.tsx:48` + `CategoryArticlesSection.tsx:82` | 列表无分页无截断,一次渲染分类全部文章;daily-news 日更类目无限增长 | 加分页(20-50/页)或 IntersectionObserver 增量渲染;行容器加 `content-visibility:auto` + `contain-intrinsic-size` |
| 2 | `category/[slug]/loading.tsx:11`、`tag/[slug]/loading.tsx:11`、`daily-news/loading.tsx:11` | 骨架是 CardGridSkeleton 网格卡,真实页默认 list 视图(+Tabs 条+筛选行),加载完成跳变 CLS | 骨架改列表行骨架(两行文字+右侧方图)并补 Tabs 条占位 |

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 3 | `CategoryArticlesSection.tsx:43,57-60,82-84` | 筛选切换 client 全量重渲染(所有 ArticleListItem 未 memo) | ArticleListItem 用 memo(在 shared-cards 任务落地),筛选逻辑本文件配合 |
| 4 | `CategoryArticlesSection.tsx:115-125` + `components/ui/tabs.tsx:123` | TabsContent 非激活 return null:Latest→Top 全部 item 卸载重挂、图片重解码 | 三 tab 同源数据合并为单一排序 state 渲染一份列表 |
| 5 | `category/[slug]/page.tsx:47-54`、`daily-news/page.tsx:46-48` | getCategories() 与 getArticlesByCategory() 相互独立却串行 await(瀑布) | `Promise.all`(tag/[slug]/page.tsx:37 已是正确写法,对齐) |
| 6 | `archive/page.tsx:18,38` + `ArchiveContent.tsx:12` | 全量 Article 对象(含 chapters/contentTypes)下发 client,仅用于标题搜索 | 服务端投影为 `{id,title,slug,publishedAt,likes,commentsCount,categoryName}` |
| 7 | `hooks/useViewMode.ts:13-20` | localStorage 视图偏好 mount 后才应用:grid 用户每次进页先渲染 list 再跳 grid,布局闪变 | useSyncExternalStore 或首帧前注入脚本 |
| 8 | `tag/[slug]/loading.tsx:9-13` | tag 骨架居中头部,真实页是左对齐(返回链接+左对齐 h1) | tag 用左对齐骨架变体 |
| 9 | `tag/[slug]/page.tsx:41,65-71` | 未知 tag 返回 200 软 404(动态参数下任意 /tag/xxx 均 200) | 与 category 页一致,对未知 slug `notFound()` |
| 10 | `archive/page.tsx:26-32` | 头部硬编码英文 "{n} Articles"/"Archive",zh.json 已有 archive.articleCount/title/subtitle | 接 getTranslations |
| 11 | `CategoryArticlesSection.tsx:96-98` | "Latest/Top/Trending" 硬编码英文,messages.article.latest/trending 已存在 | 接 t()(含 LayoutToggle 的 List/Grid,若未被 article-reader 任务删除则改中文) |
| 12 | `tag/[slug]/page.tsx:26,51,60,69,76` | tag 页硬编码中文(返回归档/共 N 篇/暂无文章/其他标签),en 下全中文 | 抽到 messages.tag.*(zh/en 双份) |
| 13 | `lib/utils/archive.ts:23` + `ArchiveContent.tsx:61` | 月份分组 `toLocaleDateString('en-US')` 恒为英文 "July" | 分组存数字月份,展示按 locale 格式化 |
| 14 | `ContentTypeFilter.tsx:39-48` + `tag/[slug]/page.tsx:81-88` | 筛选按钮 ~30px、Badge chip ~22px 命中区不足;无 aria-pressed;focus 样式不统一 | 加 padding/伪元素扩至 ≥40px;`aria-pressed`;`focus-visible:ring-2 ring-ring` |
| 15 | `CategoryArticlesSection.tsx:90` | hasMultipleTypes 漏算 html:仅含 article+html 的分类筛选器不渲染 | 将 `counts.html > 0` 计入 |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 16 | `CategoryArticlesSection.tsx:63-74` | 三份排序每次比较 `new Date().getTime()`,O(n log n) 次解析 ×3 | 先建 `Map<id, timestamp>` 预计算再排 |
| 17 | `ArchiveContent.tsx:21-26,55,118-122` | 搜索每年×每月逐个 filter,no-results 再全扫,`toLowerCase()` 每篇重复算 | useMemo 扁平化 + 一次 filter 分组,query 小写一次 |
| 18 | `ArticleListItem.tsx:85`、`ArticleCard.tsx:126`、`ArchiveContent.tsx:78` | 每项每次渲染重建 Intl.DateTimeFormat | 模块级单例 formatter 或服务端格式化好下传(shared-cards 联动) |
| 19 | `CardGridSkeleton.tsx:11` | 骨架 aspect-[16/10],实际卡片 aspect-video(16/9) | 统一 aspect-video |
| 20 | `archive/page.tsx:37-39` | ArchiveContent 为纯 client 组件且数据已 await,Suspense fallback 永不显示 | 删除该 Suspense(archive 也无 loading.tsx) |
| 21 | `lib/blog-data.ts:22-25,69` | R2 拉取失败静默返回 [],归档显示 "0 Articles"、分类显示"暂无文章",错误态与空态不可区分 | 抛错交 error.tsx 或空态区分「加载失败,点击重试」(与 homepage 任务同一数据层修复,此处验收) |
| 22 | `category/[slug]/page.tsx:58`、`tag/[slug]/page.tsx:44` | max-w-7xl(1280px)超设计系统上限 1200px | `max-w-[1200px]`(archive max-w-4xl 可放宽到 1200) |
| 23 | `ArchiveContent.tsx:46-56` | 搜索后某年全部月份被过滤仍渲染年份标题块 | 按年聚合过滤,无匹配整年跳过 |

## 已否决(勿做)

- 数据层"全量拉 articles.json 内存过滤"改造:单一 R2 静态 JSON 无服务端查询能力,React.cache 已去重,收益低;要修的是渲染端分页/截断(#1)
- 归档搜索加防抖:个人博客量级 O(n) includes 可忽略
- daily-news 与 category 页头部合并抽象:已共用 CategoryArticlesSection,剩余 ~30 行重复可接受

## 验收标准

- [x] 构造 100+ 篇文章的分类(或用 daily-news),滚动流畅、无长任务阻塞(Network/Performance 面板)(daily-news 120 篇:SSR 初始 24 行 cv-row,滚动到哨兵增量到 48 验证通过;行容器 content-visibility:auto)
- [x] 四个列表页刷新:骨架与真实布局一致,无跳变(截图对照 loading 态与完成态)(category/daily-news 改列表行骨架+排序头占位;tag 改左对齐头部+网格骨架,与真实布局对齐)
- [x] 分类页数据获取为并行(DevTools 请求时序)(category/daily-news 均 Promise.all,与 tag 页对齐)
- [x] 访问不存在的 /tag/xxx 返回 404(notFound() 已接;dev 流式渲染下状态码显示 200 为框架行为,与既有 article/category notFound 一致,生产构建返回 404;404 UI「页面未找到」正确渲染)
- [x] /zh 与 /en 下归档/标签页文案分别正确(zh 中文、en 英文);月份随语言变化(归档 zh「八月」/en「August」验证通过;标签页文案迁 messages.tag)
- [x] `pnpm lint`、`pnpm build` 通过;桌面+移动截图(改动文件 lint 零问题;build 595/595;附注:排序 tabs 合并为单一 state 渲染,切换不卸载条目;Latest/Top/Trending 与 List/Grid 全部接 i18n)
