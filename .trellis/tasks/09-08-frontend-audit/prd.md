# 全站前端审查修复(性能/UI/UX)

**优先级**:P1 | **类型**:epic/fix | **审查日期**:2026-09-08 | **完成日期**:2026-09-10 ✅

> **执行结果**:8/8 子任务全部完成并验收(详见各子任务 prd.md 验收记录)。全量改动约 80 文件;`pnpm build`(webpack)594/594 页面通过;改动文件 lint 零新增 error(`workers/` 目录 82 个 error 为基线遗留,与本次无关);未 git commit(遵守约束 5)。
>
> **用户决策覆盖**:Logo 保留原样式不改(global-shell 任务内,2026-09-10)。
>
> **已知环境事项**(非本次引入):dev(Turbopack)冷缓存下文章页 next/dynamic SSR bailout 后客户端渲染偶发不完整,生产构建/生产模式正常;验收期间以 `pnpm start` 生产模式完成文章页交互验证。

## 背景

使用 `vercel-react-best-practices`(70 条性能规则)与 `make-interfaces-feel-better`(19 条界面打磨原则)两个 Skill,通过 5 个并行审查组对全站 **13 个页面 + 全局外壳** 做代码级审查,共产出 **约 135 条具体发现**(均带 file:line 与修复方案)。

**页面覆盖矩阵**(无遗漏):

| 页面 | 路由 | 承接任务 |
|---|---|---|
| 首页 | `/` | 09-08-homepage |
| 文章详情 | `/article/[slug]`(4 种内容类型) | 09-08-article-reader + 09-08-article-sidebar-social |
| 归档 | `/archive` | 09-08-listing-pages |
| 分类 | `/category/[slug]` | 09-08-listing-pages |
| 标签 | `/tag/[slug]` | 09-08-listing-pages |
| AI 日报 | `/daily-news` | 09-08-listing-pages |
| 订阅 | `/subscribe` | 09-08-subscribe-about-legal |
| 关于 | `/about` | 09-08-subscribe-about-legal |
| 隐私/条款/收集声明 | `/privacy` `/terms` `/collection-notice` | 09-08-subscribe-about-legal |
| 后台 | `/admin` + `/api/admin/*` | 09-08-admin-security |
| 404/错误页/loading | `not-found` `error` `loading.tsx` | 09-08-global-shell |
| 全局布局 | Header/Footer/MobileNav/搜索/语言切换 | 09-08-global-shell |
| 共用卡片组件 | ArticleCard/ArticleListItem/ArticleGrid | 09-08-shared-cards |

## 子任务与建议执行顺序

| 顺序 | 任务 | 优先级 | 理由 |
|---|---|---|---|
| 1 | `09-08-admin-security` | P0 | 会话可伪造、登出失效,安全问题 |
| 2 | `09-08-global-shell` | P1 | Logo 渲染坏、Footer 死链 404、button 基类 transition-all 影响全站,先修避免其他任务返工 |
| 3 | `09-08-shared-cards` | P2 | 卡片组件被首页/列表页共用,先修避免 listing/homepage 冲突 |
| 4 | `09-08-homepage` | P1 | 门户页 |
| 5 | `09-08-listing-pages` | P1 | 4 个列表页 |
| 6 | `09-08-article-reader` | P1 | 详情页阅读器(发现最多) |
| 7 | `09-08-article-sidebar-social` | P1 | 详情页侧栏与互动 |
| 8 | `09-08-subscribe-about-legal` | P1 | 含内容真实性HIGH(about 虚假模板) |

## 全局约束(所有子任务必须遵守)

1. **hero/封面图不得添加任何徽章、标签、角标**(项目硬性约定)。
2. UI 文本一律中文并走 next-intl(同时维护 `messages/zh.json` 与 `en.json`);确属仅中文的内容(法律文本)需在 en 路由给出提示策略。
3. Server Components 默认,Client 仅交互;动效遵循 DESIGN.md minimal-functional(enter cubic-bezier(0.16,1,0.3,1),80/200/300ms)。
4. 每个子任务完成后:`pnpm lint` + `pnpm build`(必须用 webpack,勿切 Turbopack)通过;涉及视觉改动需 `pnpm dev` + 浏览器截图对照验证(深色模式,zh/en 双语言,桌面+移动视口)。
5. 不主动 git commit/push。
6. 行号基于 2026-09-08 工作区快照,执行时以实际代码为准。

## 跨任务共享文件归属(避免冲突)

- `components/ui/button.tsx`(transition-all)→ global-shell 独占
- `components/article/ArticleCard.tsx` / `ArticleListItem.tsx` / `ArticleGrid.tsx` → shared-cards 独占(listing/homepage 任务只做验收不直接改)
- `lib/blog-data.ts` 错误态 → homepage 主修,listing 验收覆盖
- `hooks/useViewMode.ts` → listing-pages 独占
