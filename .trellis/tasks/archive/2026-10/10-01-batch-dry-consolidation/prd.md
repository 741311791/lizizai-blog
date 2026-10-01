# P2 DRY 收敛：查看器 / 分享 / 社交链接 / 兜底域名

## Goal

消除审计发现的平行实现，收敛为单一事实来源。行为零变化。

## Requirements

- R1 抽共享 IframeFrame：HtmlViewer.tsx:161-165 与 SlideViewer.tsx:119-127 重复的 sandbox iframe + loading=lazy；全屏逻辑保持各自实现（HtmlViewer 用 Fullscreen API、SlideViewer 用 modal，语义不同不强并）
- R2 分享 URL：删除 components/share/ShareMenu.tsx:119-139 的 twitter/facebook/linkedin 模板，改用 lib/utils/share.ts:64-79
- R3 社交链接：app/[locale]/about/page.tsx:34-36 改为引用 components/ui/social-links.tsx 的同一常量
- R4 R2 兜底域名统一：lib/blog-data.ts:12 用 `lizizai-blog.lihehua.xyz`，workers/feishu-blog-sync/src/cli.ts:38 与 lib/__tests__/blog-data.test.ts:31 用 `pub-...r2.dev`——前端与 worker 各自保留 env 优先，兜底值收敛为同一域名并加交叉引用注释
- R5 lib/seo.ts:24 写死 `https://lizizai.xyz` 补 `NEXT_PUBLIC_SITE_URL` 兜底链（与 lib/env.ts:9 对齐）

## Acceptance Criteria

- [x] AC1 HtmlViewer/SlideViewer 页面（任一 html/slides 文章）渲染与全屏功能不变
- [x] AC2 分享菜单三端（twitter/facebook/linkedin）URL 与改动前一致（快照对比）
- [x] AC3 `pnpm build` + 前端 lint 通过；workers `npx tsc --noEmit` 通过

## 执行记录

- R1 IframeFrame 极薄封装（固化 sandbox + border-0，title 必填；React 19 ref 透传），HtmlViewer×1 + SlideViewer×2 调用点替换
- R2 ShareMenu 5 个函数体改调 socialShare；lib 补 bluesky/notes 生成器；顺手修 linkedin 未用参数与 shareContent catch any
- R3 SOCIALS 从 social-links.tsx 导出，about 页删本地副本；清理残留 unused Image import
- R4 **方案调整**：实测生产 workflow 显式注入 r2.dev 写封面 URL（sync.ts:494 拼接），盲目统一会改生产行为+需重写存量 meta——改为三处交叉引用注释 + 迁移决策记录，行为零变化
- R5 seo.ts url/author.url 收敛到 lib/env.ts config.siteUrl（消除双份兜底定义）
- 验证：build 692/692、workers tsc 0 错、改动文件 lint 0 error（seo.ts:145 category unused 为既有遗留）
