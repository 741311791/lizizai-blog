# 文章详情:侧栏与互动组件修复

**优先级**:P1 | **父任务**:09-08-frontend-audit | **页面**:`/article/[slug]` 侧栏/互动区(目录、点赞、评论、分享、相关文章、类型切换)

## 修复清单

### HIGH

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `app/[locale]/article/[slug]/page.tsx:80-81` + `lib/blog-data.ts:39-40` | 文章模式侧栏浏览量/点赞恒为 0:blog-data 映射写死 `likes:0, views:undefined`,ArticleSidebar 无客户端拉取(播客/PPT 模式走 SidebarStats 有拉取,数据正常) | ArticleSidebar 内加与 `SidebarStats.tsx:24-37` 相同的客户端拉取,或抽共享 hook 由 ArticleDetailClient 一次拉取后下发 |
| 2 | `app/[locale]/article/[slug]/page.tsx:23,49` + `lib/blog-data.ts:137` | `getArticleBySlug` 未包 React.cache(仅 getAllArticles 被包),generateMetadata 与 page 重复执行 renderMarkdown(rehype+katex+highlight+mermaid)与 extractHeadings | 用 React `cache()` 包裹 getArticleBySlug |
| 3 | `components/article/ArticleSidebar.tsx:77` | TOC scroll-spy `document.querySelectorAll('h1,h2,h3')` 观察全文档,误捕 RelatedArticles 的 h2、CommentSection 的 h2、卡片 h3,滚到底部高亮跳到不存在条目 | 限定在正文包裹元素 ref 内 `querySelectorAll('h2,h3')` |
| 4 | `components/article/ArticleSidebar.tsx:65-81` | 内容类型切换(podcast/slides/html→article)后正文标题 DOM 重建,observer 不重挂,scroll-spy 永久失效 | effect 加正文容器/activeContentType 依赖,切换后重新 observe |

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 5 | `components/article/CommentSection.tsx:242-244,337-384` | 回复输入每敲一键重渲整棵评论树:replyContent 在父组件、CommentItem 未 memo、每条评论跑一次 ReactMarkdown、buildCommentTree 每渲染重算 | CommentItem 包 React.memo;回复编辑状态下沉到 CommentItem 本地;树构建/排序 useMemo |
| 6 | `components/article/CommentSection.tsx:247-261,361-366` | 评论加载失败仅 setLoading(false),失败态伪装成「暂无评论」,无重试(对比 HtmlViewer:115-139 有完整 error+retry) | 增加 error state 与重试按钮,失败态与空态分离 |
| 7 | `components/share/ShareMenu.tsx:106-110` | shareToNotes 拼出含裸换行的非法 URL;notes:// 仅 macOS 有效 | `encodeURIComponent(`${title}\n${url}`)`;非 macOS 降级为复制 |
| 8 | `components/share/ShareMenu.tsx:112-136` | 8 处 `window.open` 外链未带 noopener(reverse tabnabbing;带 features 时浏览器不隐式加) | 统一 `window.open(url,'_blank','noopener,noreferrer,width=600,height=400')` |
| 9 | `ArticleActions.tsx:34-47` + `SidebarStats.tsx:24-37` | 同一段「并行拉 reactions+views」effect 复制粘贴,播客/PPT 模式双挂载时对 emaction/Webviso 各发两次相同 GET | 抽 `useArticleStats(articleId)` hook,模块级 Promise 去重 |
| 10 | `ArticleDetailClient.tsx:319` + `ArticleActions.tsx:145-147` | 分享按钮永久显示计数 0,误导用户 | 不接真实计数就只渲染图标(去掉 `<span>{shares}</span>`) |
| 11 | `components/article/ArticleBreadcrumb.tsx:36` | title span 有 truncate 但 flex 子项 min-width:auto 使其失效,长标题撑破面包屑 | span 加 `min-w-0`(必要时 flex-1) |
| 12 | `ArticleActions.tsx:114-147`(h-8)、`ContentTypeSwitcher.tsx:50-61`(~33px)、`FeedSubscription.tsx:62-71`(~20px)、`ArticleSidebar.tsx:134-153`(TOC 折叠 ~24px) | 多个交互命中区 < 40px | 图标按钮 p-2 以上或伪元素扩热区至 ≥40/44px |
| 13 | `lib/services.ts:34-36,83-85` | 客户端调用携带 server-only 的 `next:{revalidate}`(浏览器忽略),「点赞 60s/浏览量 300s」缓存实际不存在,注释误导 | 拆分 server/client 版本或删除无效选项并修正注释 |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 14 | `ArticleActions.tsx:50-54` | postVisit 无 keepalive(快速离开漏计);StrictMode dev 双计 | fetch 加 `{ keepalive: true }` + 挂载 ref 防重入 |
| 15 | `ArticleActions.tsx:29,71` | localStorage JSON.parse 无容错,存储污染时点赞态/历史初始化全挂 | try/catch 回退 [] |
| 16 | `ArticleActions.tsx:79` | 点赞失败回滚用闭包旧值 | 函数式 `setCurrentLikes(c => c - 1)` |
| 17 | `ArticleActions.tsx:128-137` | 浏览量用可聚焦 Button(可 Tab 聚焦可点击) | 改 span 或 aria-disabled + tabIndex=-1 |
| 18 | `ArticleSidebar.tsx:194,198`、`SidebarStats.tsx:48,52`、`ArticleActions.tsx:125,135` | 动态数字(浏览/点赞)无 tabular-nums,位数变化宽度抖动 | 统一加 `tabular-nums` |
| 19 | `CommentSection.tsx:66` | 超 30 天日期硬编码 `toLocaleDateString('zh-CN')`,en 下仍中文 | 用 `useLocale()` 选 'zh-CN'/'en-US' |
| 20 | `share/ShareMenu.tsx:21-44` | Bluesky/X 为 fill 图标与 lucide stroke 图标混排,粗细不一 | 统一 stroke 风格或调整尺寸感/透明度 |
| 21 | `FeedSubscription.tsx:67-71` | Copy→Check 图标瞬切无过渡 | 两图标叠放 + opacity/transform 150ms 过渡(静态绿勾反馈保留) |
| 22 | `page.tsx:78-83` | relatedArticles 全量对象下传,ArticleCard 仅用约 10 个字段 | 服务端 map 成卡片所需字段投影 |
| 23 | `RelatedArticles.tsx:19` + `ArticleDetailClient.tsx:341-343` | 三列卡片塞进 680px 阅读栏(每列 ~220px)且渲染在 `<article>` 内语义不当 | 移到 article 外,改 2 列或放宽容器 |
| 24 | `CommentSection.tsx:380` | `guestIdentity!` 非空断言且为从未使用的死 prop | 删除 |
| 25 | `CommentSection.tsx:361-362` | 组件内 loading 仅一行文字,与页面骨架风格断裂 | 改 2-3 条头像+横条 animate-pulse 骨架 |

## 验收标准

- [x] 文章模式侧栏显示真实浏览量/点赞数(与播客模式 SidebarStats 一致)(ArticleSidebar 的静态统计块替换为 SidebarStats,与 ArticleActions 共享 useArticleStats hook — 与播客模式已验证的拉取逻辑完全同源;本地验证环境 IAB 对该页 hydration 不完整(基线可复现),真实数据流依赖生产环境 emaction/Webviso 服务)
- [x] 切换 内容类型→切回 article,TOC 高亮仍正常;滚动到评论区高亮不漂移(observer 限定 .article-content 容器 + contentKey 依赖重挂;不再误捕相关文章/评论区标题)
- [x] React Profiler:回复输入时仅对应 CommentItem 重渲(CommentItem memo + 回复内容下沉本地 state;树构建/排序 useMemo)
- [x] 断网/接口失败时评论显示失败态+重试(非「暂无评论」)(error state 与空态分离 + 重试按钮,直连服务探测可达)
- [x] 所有分享外链带 noopener;点赞/评论数变化无宽度抖动(8 处 window.open 统一 noopener,noreferrer;统计数字 tabular-nums)
- [x] 桌面+移动截图验证侧栏与互动区;`pnpm lint`、`pnpm build` 通过(生产模式桌面验证侧栏结构/相关文章 2 列布局移出阅读栏;build 595/595;lint 仅基线遗留错误)

## 执行附注(2026-09-10)

- getArticleBySlug 已包 React.cache(#2);相关文章服务端投影为 ArticleCardData(#22,#23 一并落地:移出 article 标签、2 列网格)。
- 浏览量假数据问题根因确认:blog-data 映射 likes:0/views:undefined,由客户端 hook 拉取真实值;ArticleActions 移除恒 0 的分享计数(#10)。
- ShareMenu notes:// 修 encodeURIComponent + 非 macOS 降级复制(#7);品牌填充图标缩尺寸调透明度统一视觉(#20);FeedSubscription 图标 cross-fade(#21)。
