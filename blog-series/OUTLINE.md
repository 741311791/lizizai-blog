# 七期细纲（写作 agent 的直接依据）

> 所有技术事实以本文件与仓库代码为准（可读 CLAUDE.md 与指定源码文件核对）。写第 N 期前先读 SERIES-BRIEF.md。

---

## 第 1 期（p1）：让飞书文档变成博客

**标题**：无服务器博客搭建记（1/7）：让飞书文档变成博客
**一句话**：整条链路鸟瞰——在飞书写文档，读者第二天在网站上看到它，中间没有任何一台我管理的服务器。

**要点**：
- 痛点：想要「写作体验」和「发布体验」同时好——Wordpress 后台写作痛苦，本地 MD 写作+手动发布割裂
- 全链路角色比喻：飞书=编辑部、GitHub Actions=取稿快递员、R2=仓库、Vercel=印刷厂、边缘服务=读者服务台
- 真实选型演变（独家素材）：项目最初用 **Strapi**（headless CMS）+ 本地 MDX，`scripts/migrate-strapi-to-mdx.ts`、`lib/content.ts` 是遗迹，后来全部删掉——headless CMS 对单人博客太重：要管服务器/数据库、后台编辑器不如飞书顺手
- 各组件一句话职责 + 全部免费/免费额度的成本结构

**对比表素材**：WordPress/Ghost（自托管，要服务器+数据库+运维）；Hugo/Astro + Git（本地写作，纯静态，但发布要 commit 推仓库，写作环境是编辑器）；NotionNext/Super.so（同为「文档即发布」，但深度依赖单一平台 API 与限流）；headless CMS（Strapi/Contentful，专业但重）；我们=飞书+无服务器全托管
**Mermaid 图设计**（flowchart LR）：飞书文档 →（GitHub Actions 每日定时取稿）→ R2 存储（articles.json+每篇内容）→（Vercel 构建时拉取，ISR 缓存）→ 读者浏览器；旁路：emaction/Webviso/cf-comment/counterscale 四个边缘服务与浏览器直接交互
**代码素材**：`.github/workflows/feishu-sync.yml` 的 cron 与触发部分（截短）
**字数**：3500 左右

---

## 第 2 期（p2）：同步器——163 篇文章如何做到每天只传有变化的

**标题**：无服务器博客搭建记（2/7）：同步器——163 篇文章如何做到每天只传有变化的
**一句话**：定时任务如何判断「哪些文章改过了」——高水位检查点增量检测。

**要点**：
- 全量重传的问题：163 篇 × 每篇若干文件 ≈ 一轮 1 小时 40 分，浪费且容易超时
- 高水位（watermark）概念：每篇文章每种内容类型记一个「上次见到的最大修改时间」，任一类型有更新才同步（解释为什么不能用「子文件 mtime > 文章 mtime」——播客/PPT 生成晚于文章，mtime 天然偏大，增量会永久失效，这是真实踩过的坑，详见第 7 期）
- blogFolder 结构：以文章标题命名的文件夹，内含 `文章/播客/PPT/html` 子文件夹，按名字严格映射内容类型
- 失败隔离：播客/PPT/HTML 同步失败不阻塞文章主内容（try/catch 吞错记日志）
- 增量写索引：每 10 篇落盘一次 articles.json，超时也能保住进度
- GitHub Actions 的取舍：webhook 即时 vs cron 轮询；免服务器、可手动 dispatch 应急；代价=小时级延迟

**对比表素材**：飞书事件订阅 webhook（实时但要常驻服务接收）；Contentful/Sanity 官方增量 sync API（产品化但绑定厂商）；rsync/git diff（文件系统思路，没法接飞书 API）；我们=定时轮询+高水位
**Mermaid 图设计**（flowchart TD）：cron 触发 → 列出飞书文件夹 → 单篇文章：读 meta.json 检查点 → 对比各类型 mtime 高水位 →（有变化）分类型同步 article/podcast/slides/html → 写 R2 → 更新检查点；（无变化）跳过 → 每 10 篇写一次 articles.json → 结束
**代码素材**：`workers/feishu-blog-sync/src/sync.ts` 中 checkpoint 判断逻辑（截短）
**字数**：3500-4000

---

## 第 3 期（p3）：一篇文章的四种形态——iframe 沙箱与高度同步

**标题**：无服务器博客搭建记（3/7）：一篇文章的四种形态
**一句话**：同一篇文章可以有文字/播客/幻灯片/交互 HTML 四种形态，HTML 怎么安全地嵌进页面。

**要点**：
- ContentType 与 blogFolder 子文件夹的映射（接第 2 期）
- 主类型优先级：html > slides > podcast，决定默认展示形态
- 核心难题：第三方生成的 HTML 不受信任，直接嵌页面有 XSS 风险 → iframe + `sandbox="allow-scripts"`（无 `allow-same-origin`，HTML 摸不到父页面 DOM，解释这个参数为什么是安全底线）
- 高度自适应：iframe 内外不同源，父页面读不到内容高度 → 唯一通道是一条 `postMessage`（`html-content-height`），HTML 主动汇报高度，父页面被动适配
- 内置浮动目录 vs 跨 frame 目录：为什么目录做进 HTML 里而不是父页面做（沙箱隔离了 DOM，IntersectionObserver 高亮没法跨 frame）
- 全屏模式：Fullscreen API，iframe 独立滚动时目录体验最佳
- 自包含 HTML 规范：主题 CSS + 字体 + 高度同步脚本 + 内置目录四要素

**对比表素材**：WordPress ACF 自定义字段（结构化但表达力有限）；Next.js MDX（`import` 组件，表达力最强，但内容必须在代码库里，飞书写不了）；Notion embed（受限白名单）；我们=iframe 沙箱（任意 HTML 表达力+安全隔离，代价=通信只能走 postMessage 单行道）
**Mermaid 图设计**（flowchart TD）：文章页加载 → ArticleDetailClient 按 contentType 分发 → article→ArticleContent / podcast→AudioPlayer+播客列表 / slides→SlideViewer / html→HtmlViewer → iframe sandbox 加载 → postMessage(height) 上报 → 父页面调整高度；旁路：全屏按钮 → Fullscreen API
**代码素材**：`components/article/IframeFrame.tsx`（整个文件，很短，正好展示沙箱封装）+ HtmlViewer 中 postMessage 监听片段
**字数**：3500-4000

---

## 第 4 期（p4）：评论、点赞、浏览量——博客不碰数据库

**标题**：无服务器博客搭建记（4/7）：博客不碰数据库
**一句话**：四个 Cloudflare Worker 边缘服务各配一个 D1 数据库，博客前端只持有一把 URL。

**要点**：
- 传统做法的问题：评论/点赞要后端 API + 数据库 + 防刷，个人博客自建一套的运维成本
- 边缘服务架构：cf-comment（评论）、emaction（点赞，兼容 GitHub 表情）、Webviso（浏览量）、counterscale（分析）——各自独立 Worker + 各自 D1
- 为什么四个独立服务而不是一个 monolith：故障隔离（评论挂了点赞照常）、各自演进、免费额度独立核算；也有代价——四套部署配置
- 前端聚合：列表页要显示 N 篇文章的浏览量 → 批量接口 `getBatchViews`；详情页 Promise.all 并行拉取 + 模块级 Map 缓存在途去重
- 评论走 iframe 隔离（第三方组件不进主 bundle）
- 缓存的诚实：浏览量是客户端直连获取的，服务端 fetch 的 revalidate 缓存对浏览器无效——一个真实纠偏案例（我们曾在客户端 fetch 上配了 `next: { revalidate: 300 }`，无效果，删掉了）

**对比表素材**：自建 API routes+数据库（全控制，全运维）；Disqus/Giscus（零运维但数据在别人手里、样式难统一、国内访问性）；我们=Cloudflare Workers+D1 边缘自建（数据自己的、免费额度内零成本、要写点代码）
**Mermaid 图设计**（sequenceDiagram 或 flowchart LR，用 flowchart）：浏览器打开文章页 → 并行请求：emaction(点赞数)/Webviso(浏览量)/cf-comment iframe(评论)/counterscale(匿名分析) → 各服务各写各的 D1；虚线：博客 Vercel 端只有 NEXT_PUBLIC_*_URL，无任何数据库凭证
**代码素材**：`hooks/useArticleStats.ts` 的 Promise.all 片段（截短）
**字数**：3000-3500

---

## 第 5 期（p5）：性能——把 react-markdown 全家桶赶出浏览器

**标题**：无服务器博客搭建记（5/7）：把渲染成本从读者挪到构建时
**一句话**：KaTeX+代码高亮+Mermaid 渲染全家桶进浏览器有多重，服务端预渲染+组件降级+分层懒加载三板斧。

**要点**：
- 问题的量化直觉：react-markdown + rehype-katex + highlight.js + mermaid 客户端渲染 = 每个读者每次访问都要下载+执行这套管线，中文博客流量小但内容重，纯亏
- 板斧一：服务端 unified pipeline 预渲染——构建/ISR 时把 markdown 渲染成 HTML 字符串，浏览器只收静态 HTML + 一个复制代码按钮；mermaid 在服务端直接转成内联 SVG（`lib/markdown.ts`）
- 板斧二：假 Client Component 降级——`use client` 的滥用：只用了 `useTranslations` 的组件其实是 Server Component（next-intl 在服务端同样可用），9 个组件降级，每页白赚 bundle 缩减（真实案例：Footer/AboutMe/ContentTypeBadgeV2 等）
- 板斧三：next/dynamic 分层懒加载——播客播放器/幻灯片查看器/评论框只在用到时加载（`ssr: false`）
- 搜索的同类思路：Pagefind 构建时爬全部静态页生成索引，浏览器端本地检索，零后端
- ISR 缓存策略：页面 3600s，紧急更新走 revalidate API 全量清除

**对比表素材**：客户端渲染路线（Next.js 官方 MDX 插件默认就是客户端组件内渲染，多数博客如此——交互强但重）；纯静态导出（Hugo 思路，最快但每次发文全站重建）；我们=服务端预渲染+ISR（构建时算一次，读者只下载结果，发文后最多 1 小时生效）
**Mermaid 图设计**（flowchart TD，前后对照可画两张子图或一张分左右）：上半：改造前——浏览器下载 react-markdown+katex+hljs+mermaid 全家桶 → 客户端渲染 → 水合；下半：改造后——构建时 unified pipeline 渲染 → R2/ISR 缓存 HTML → 浏览器只收静态 HTML+复制按钮
**代码素材**：`lib/markdown.ts` 的 unified 链式调用（截短）；`components/article/ArticleDetailClient.tsx` 的 dynamic 片段（截短）
**字数**：4000 左右

---

## 第 6 期（p6）：构建稳定性——三个只有中文站才会踩的坑

**标题**：无服务器博客搭建记（6/7）：构建为什么总是失败
**一句话**：Turbopack 中文字体崩、IPv6 到 Cloudflare 不通、构建机网络抖动——三个真实构建故障的排查与根治。

**要点**：
- 坑一：Next 16 默认 Turbopack，`next/font/google` 引中文字体（Noto Serif SC 等）构建必崩——降级 `--webpack` 的决策（保留至今，注释写明原因；顺带讲 Turbopack/webpack 现状与中文 Web 字体的特殊性）
- 坑二：本机构建拉 R2 数据超时——现象：SSG 阶段 fetch failed ConnectTimeoutError，attempted address 是 IPv6；根因：本机 IPv6 到 Cloudflare 不通而 IPv4 正常，Node 22 DNS 默认 verbatim 顺序优先 IPv6；修复：`dns.setDefaultResultOrder('ipv4first')`，但 next.config 里设置只作用于主进程，SSG worker 不继承 → 移到 `instrumentation.ts` 的 register()，每个 worker 启动都执行才根治
- 坑三：偶发抖动 → fetch 退避重试（3 次尝试 300ms/800ms 退避，5xx/429 同样重试）+ SSG 并发 worker 数限制（cpus: 4）
- 方法论沉淀：网络类构建失败先看 attempted addresses（IPv4 还是 IPv6）再动手，别急着怪代理
- 环境：本地 vs Vercel 构建机差异——这些修复在 Vercel 上不需要但无代价，统一保留

**对比表素材**：官方默认路径（Turbopack）vs 我们（webpack 降级）；本地开发直连 vs CI 容器网络；监控告警方案（Sentry/CI 通知）vs 我们（构建失败即通知+日志，个人项目够用）
**Mermaid 图设计**（flowchart TD 排查决策树）：构建 fetch 失败 → 看错误里 attempted address →（IPv6）检查本机 IPv6 连通性 → 不通 → ipv4first → 仍偶发 → 退避重试 → 仍不稳 → 限并发；另一分支（IPv4 也失败）→ 查代理/DNS
**代码素材**：`instrumentation.ts`（整个文件，短且是主角）
**字数**：3000-3500

---

## 第 7 期（p7）：运维——当同步静默失败的那一个月

**标题**：无服务器博客搭建记（7/7）：静默失败的一个月
**一句话**：Daily News 停更一个月才发现——三次连锁故障的完整复盘，以及为什么「通知条件写对」比上监控系统重要。

**要点**（全部真实事件，按时间线讲）：
- 现象：每日资讯自 2026-08-23 停更，无任何报警
- 故障一（根因）：增量判断口径不一致——判断侧对 slides/html 子文件夹用**顶层列表**（含子文件夹条目）取 max mtime，写入侧检查点用**递归全文件**取 max mtime；飞书文件夹 mtime 恒晚于内部文件 1-2 秒 → 含 PPT 的文章每轮都判「已修改」→ 每轮全量重传（162 项中 76 全量、仅 6 跳过）
- 故障二：全量一轮约 2 小时 > workflow timeout 60 分钟，每次在写索引前被杀；articles.json 只在整个循环结束后写 → 索引永远停在 8/23，但单篇文章文件其实已传上 R2（更迷惑人）
- 故障三：通知只在 `failure()` 时发，超时是 `cancelled` 状态 → 一个月零报警
- 修复：口径统一到顶层列表、索引每 10 篇增量落盘、通知条件改 `failure() || cancelled()`、timeout 临时调 180 跑追赶（1h37m 完成，恢复到最新）
- 尾声彩蛋（2026-10-01）：想迁移封面图域名触发「全量重传」，发现 force_sync 开关失灵——workflow 里 `force_sync` 是 boolean input，命令展开却写 `inputs.force_sync == 'true'` 字符串比较，GitHub Actions 表达式里 boolean 与字符串比较恒为 false → **手动全量同步从未真正生效过**；修成 boolean 直判后真全量 1h40m31s 跑完
- 方法论：静默失败三要素（状态误判+超时截断+通知盲区）；「让失败显性化」原则（同类案例：postbuild 的 `|| true` 吞掉搜索索引生成失败，也删掉了）

**对比表素材**：全链路 APM（Sentry/Datadog，专业但个人项目 ROI 低）；纯人工巡检（免费但延迟以月计）；我们=CI 状态通知+关键路径显性失败+复盘文档
**Mermaid 图设计**（flowchart TD 因果链）：口径不一致 → 每轮全量重传 → 2h > 60min timeout → 写索引前被杀（cancelled）→ 通知只看 failure() → 无报警 → 停更一个月；修复路径分叉：口径统一/增量落盘/通知补 cancelled
**代码素材**：workflow 通知条件修复前后两行对比；force_sync 修复前后两行对比
**字数**：4000-4500（压轴期，故障复盘最有可读性）

---

## 事实核对来源（写作时不确定就读源码）

- 架构总览：`CLAUDE.md`
- 同步器：`workers/feishu-blog-sync/src/sync.ts`（961 行，读关键函数即可：blogFolderNeedsSync / syncCheckpoints / syncDocument）
- 多内容类型：`components/article/ArticleDetailClient.tsx`、`components/article/IframeFrame.tsx`、`components/article/HtmlViewer.tsx`
- 边缘服务：`lib/services.ts`、`hooks/useArticleStats.ts`
- 性能：`lib/markdown.ts`、`components/article/ArticleDetailClient.tsx`、`lib/__tests__/`
- 构建稳定性：`instrumentation.ts`、`next.config.ts`、git log 里 `d0fba8b`、`507227e`
- 运维复盘：`.trellis/tasks/09-28-feishu-sync-stall-fix/prd.md`（完整诊断记录）与 `.github/workflows/feishu-sync.yml`
