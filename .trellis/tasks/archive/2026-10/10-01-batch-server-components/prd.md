# P1 降级 9 个假 Client Component + 缓存配置纠偏

## Goal

去掉仅用 `useTranslations`（Server Component 同样支持）的 `use client` 声明，减小客户端 JS 与水合开销；修正无效/缺失的缓存语义。

## Requirements

- R1 逐个移除 `use client` 并将 `useTranslations` 改为 `next-intl` 服务端导入（9 个文件）：
  - components/layout/Footer.tsx:1
  - components/article/ArticleBreadcrumb.tsx:1
  - components/article/ContentComingSoon.tsx:1
  - components/home/AboutMe.tsx:1
  - components/ui-v2/AuthorCardV2.tsx:1
  - components/ui-v2/ContentTypeBadgeV2.tsx:1
  - components/ui-v2/HtmlSidebarV2.tsx:1
  - components/ui-v2/RelatedArticlesV2.tsx:1
  - components/analytics/CounterscaleScript.tsx:1（next/script 可在 Server 侧用）
- R2 注意：若上述组件被 Client Component 父级 import，降级不产生 bundle 收益但仍安全；若传入了函数 props 则跳过并记录
- R3 `lib/services.ts:96-106` getBatchViews：客户端直连 fetch 上的 `next: { revalidate: 300 }` 无效（Data Cache 仅服务端）——删除该配置、修正注释
- R4 feed 系列 route（app/feed.xml/route.ts、app/feed/{podcast,article}.xml、feed/category/[slug]、feed/[type]/[slug]）显式 `export const revalidate = 3600`
- R5 CLAUDE.md ISR 段落同步：实际页面级仅 3600s；300s/60s 描述与代码不符，改为如实描述

## Acceptance Criteria

- [x] AC1 每个改动组件页面本地 dev 渲染正常（抽 Footer/AboutMe/ContentTypeBadgeV2 三处）
- [x] AC2 `pnpm build` 成功；对照构建输出中被降级组件是否退出 client bundle
- [x] AC3 feed.xml 请求返回 200 且带缓存头语义（本地验证）

## 执行记录

- 9 文件移除 'use client'（审计复核：props 均数据接口、0 交互标记）
- services.ts getBatchViews 删无效 next.revalidate（唯一调用方 ArticlesSection useEffect 为浏览器端）
- 5 个 feed route + sitemap.ts 加 export const revalidate = 3600；CLAUDE.md ISR 描述如实化（300s/60s 实不存在）
- 验证：build 692/692 静态页；dev 冒烟首页 200 且 <footer> 服务端渲染
