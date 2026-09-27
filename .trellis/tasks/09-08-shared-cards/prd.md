# 共用卡片与列表项组件修复

**优先级**:P2 | **父任务**:09-08-frontend-audit | **范围**:`components/article/ArticleCard.tsx`、`ArticleListItem.tsx`、`ArticleGrid.tsx`(被首页/分类/标签/日报/相关文章共用,独立成任务避免多任务冲突)

## 修复清单

### HIGH

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `ArticleCard.tsx:61-89` + `ArticleListItem.tsx:108-120` | `<button>`(点赞/分享)嵌套在 `<Link>`(渲染为 `<a>`)内:非法 HTML,键盘 Tab 先聚焦外层 a 再进按钮,行为混乱(仅靠 preventDefault 兜底) | 重组结构:卡片主体为 Link(用 `after:absolute after:inset-0` 撑满点击区),操作按钮 `relative z-10` 浮层脱离嵌套 |

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 2 | `ArticleCard.tsx:80-88` | Heart/MessageCircle 无任何 onClick 却以按钮样式呈现,误导点击 | 改为非交互 span 样式,或接真实点赞数/评论锚点 |
| 3 | `ArticleCard.tsx:46-57`、`ArticleListItem.tsx:126`、`ArticlesSection.tsx:185-193` | 封面图无描边,与卡片底色缺层次(设计规范:深色模式 `oklch(1 0 0 / 0.1)` 纯白 1px 描边,禁用带色调中性色) | 图容器加 `ring-1 ring-white/10`;**严禁同时给封面添加任何徽章/标签** |
| 4 | `ArticleListItem.tsx:126-134` | 分类/日更页默认 list 视图,首项缩略图是 LCP 候选却全 lazy | index 0 传 `priority`,其余保持 lazy |
| 5 | `ArticleGrid.tsx:36-38` | ArticleCard 未 memo(GridCard 已 memo),viewMode/tab 切换全卡片重渲染 | 同样包 `memo` |
| 6 | `ArticleListItem.tsx:85`、`ArticleCard.tsx:126` | 每项每次渲染 `new Intl.DateTimeFormat`/`toLocaleDateString` 重建 | 模块级单例 formatter(参照 ArticlesSection.tsx:168 的正确写法) |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 7 | `ArticleCard.tsx:121-153`、`ArticleListItem.tsx:85-118` | 计数/日期等动态数字无 tabular-nums,宽度抖动 | 数字 span 加 `tabular-nums` |
| 8 | `ArticleCard.tsx:95-103` | 多行标题末行孤字、摘要末行过短 | 标题 `text-balance`、摘要 `text-pretty` |
| 9 | `ArticleCard.tsx:61-89` | 透明覆盖层按钮桌面 opacity-0 但仍在 tab 序列,聚焦不可见 | `group-focus-within:opacity-100` 显形 |
| 10 | `ArticleCard.tsx`、筛选相关按钮 | 无按压反馈 | `active:scale-[0.96]` + `transition-transform`(值不可小于 0.95) |

## 验收标准

- [x] HTML 校验(或 React 控制台)无 a 内嵌 button 告警;整卡可点、分享/点赞可独立点击、键盘 Tab 顺序合理(标题链接 after:inset-0 撑满整卡,分享按钮 z-10 浮层;首页残留 2 处 a>button 来自首页组件订阅 CTA/DailyNews,归 homepage 任务)
- [x] Heart/Comment 不再呈现为可点击按钮(改为非交互 span + aria-hidden 图标)
- [x] 首页/分类/标签/日报/相关文章五个使用点截图回归:封面描边统一、无徽章引入、布局无回归(桌面+移动均验证)
- [x] tab/视图切换时仅必要卡片重渲(React Profiler 抽查)(ArticleCard/ArticleListItem 均 memo,与 GridCard 同策略)
- [x] `pnpm lint`、`pnpm build` 通过(改动文件零新增问题,build 595/595)
