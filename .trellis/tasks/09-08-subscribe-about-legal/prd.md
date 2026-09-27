# 订阅/关于/法务页修复

**优先级**:P1 | **父任务**:09-08-frontend-audit | **页面**:`/subscribe`、`/about`、`/privacy`、`/terms`、`/collection-notice`、`/api/subscribe`

## 修复清单

### HIGH

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `app/[locale]/subscribe/page.tsx:1` | 整页 `'use client'`:SEO metadata 全缺(无 title/description/canonical/OG),benefits 等纯静态内容全打进客户端 bundle | 改 RSC(服务端 `getTranslations` 可用),仅保留 SubstackEmbed 一个 client island;补 `generateMetadata`(参考 `lib/seo.ts`) |
| 2 | `app/[locale]/about/page.tsx:22-131` | DAN KOE 模板内容未替换:picsum 占位头像(alt 仍是 "DAN KOE")、「178,000+ Subscribers」虚假社交证明、正文全英文,而 metadata 是中文「关于我们」;docs/subscription-architecture.md §2 明确要求清理 | 替换为真实作者头像与文案;虚假订阅数删除;整页文案迁入 `messages/*.json` about 命名空间(zh/en 双份) |
| 3 | `app/[locale]/about/page.tsx:68-84,128-130` | 5 个死按钮:Twitter/LinkedIn/YouTube/Website 无 href 无 onClick,「Subscribe Now」无跳转 | `Button asChild` 包 `<a href target="_blank" rel="noopener noreferrer">`;Subscribe 用 `<Link href="/subscribe">` |
| 4 | `app/api/subscribe/route.ts:61-109` | 死端点:前端零调用(UI 走 SubstackEmbed);若被直接 POST 会经 Resend 收集邮箱,直接违反 privacy:21 与 collection-notice:42「邮箱由 Substack 收集,本博客不存储」;且无限流 | **删除该 route 及 resend 依赖**(推荐);若保留则必须加限流并让法务页口径覆盖 |

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 5 | `app/api/subscribe/route.ts:40,75` | name 未转义拼入邮件 HTML(可注入);`console.log` 记录订阅者邮箱(PII 入日志) | 随 #4 删除即消解;若保留则 HTML escape + 日志脱敏 |
| 6 | `privacy/page.tsx:3-6`、`terms:3-6`、`collection-notice:3-6` | 法律页 metadata 硬编码中文不随 locale 变;未设自身 canonical,继承的 hreflang 对非首页指向错误 | 每页改 `generateMetadata(locale)` 输出自身 canonical 与正确 alternate(复用 `lib/seo.ts:203-206` 模式) |
| 7 | `privacy/page.tsx:8-64`、`terms:8-58`、`collection-notice:8-60` | 法律正文硬编码中文,en 用户读中文;messages 中 privacy/terms/collection 命名空间已建却未用 | 至少标题/元数据走 `useTranslations`;正文若确定仅中文,en 路由渲染提示条(或维护英文版) |
| 8 | `components/subscribe/SubstackEmbed.tsx:58-64,74` | `window.open` 返回值未检查,弹窗被拦截时点击无任何反馈;Input 无 `name`;`aria-label="email"` 硬编码英文 | `const win = window.open(...); if (!win) window.location.href = target`;加 `name="email"`;aria-label 用本地化文案 |
| 9 | `components/subscribe/SubstackEmbed.tsx:68-78` | 订阅输入框与按钮 36px,全站主转化入口命中区不足 | Input h-11 + 按钮 `size="lg"`,移动端 ≥44px |
| 10 | `about/page.tsx:39,57`、`privacy:13`、`terms:13`、`collection-notice:13` | `prose prose-invert prose-lg` 全部无效:@tailwindcss/typography 未安装、globals.css 也无 .prose 定义,纯死类 | 三选一:安装 typography 插件 / globals.css 自定义 .prose / 删除死类(推荐删除,排版已有手动类兜底) |
| 11 | `about/page.tsx:23` | 头像用 Radix AvatarImage 直链 picsum(400px 源图渲染 128px),绕过 next/image | 真实头像放 `public/`,`next/image width={128} height={128} sizes="128px"` + 描边 `ring-1 ring-white/10` |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 12 | `subscribe/page.tsx:60` | 卡片 `shadow-lg` 在 #09090b 上晕成灰雾,编辑风应以边框驱动 | 改 `shadow-xs` 或纯 `border border-border`(与 legal/about 卡片统一) |
| 13 | `subscribe/page.tsx:73` | Check 图标 `text-green-600` 跳出琥珀金单强调色体系 | 改 `text-primary`(绿色仅留语义态) |
| 14 | `subscribe/page.tsx:60-78` | 同心圆角不成立:卡片 rounded-lg(8)+p-8,内嵌 Input/按钮 rounded-md(6) | 卡片升 rounded-xl(12)+内部 rounded-lg(8),或 Input 改 rounded-sm |
| 15 | `subscribe:37`、`about:26`、三法律页 | h1 无 `text-balance`;法律长段落无 `text-pretty` | h1 加 text-balance,法律 p 加 text-pretty |
| 16 | `SubstackEmbed.tsx:41-54` | iframe variant 无 `loading="lazy"`、内联白底 `background:'white'`、废弃属性 frameBorder;当前无调用方 | 删除该 variant(推荐)或 lazy + 清理样式 |
| 17 | 三法律页 | 长文无锚点目录、无返回顶部 | section 加 id,页首渲染锚点目录 |
| 18 | `subscribe/page.tsx:14-21` | benefits/features 数组每次渲染重建 | 改 RSC 后自然消解(随 #1) |
| 19 | `api/subscribe` 欢迎邮件 | 紫色渐变 #667eea 与品牌琥珀金冲突 | 随 #4 删除即消解 |

## 验收标准

- [x] `/zh/subscribe` 与 `/en/subscribe` 均有完整 metadata(view-source 查 title/description/canonical)(zh「订阅 Zizai Blog | Zizai Blog」+ en canonical /en/subscribe 验证;页面改 RSC,SubstackEmbed 为唯一 client island)
- [x] about 页无 DAN KOE/picsum/虚假订阅数;5 个外链可点击且带 rel="noopener";Subscribe 跳转正常(curl 验证 0 处模板残留、7 处 noopener、/subscribe 链接、真实头像 avatar_smile;文案全量迁入 messages.about 双语)
- [x] `POST /api/subscribe` 返回 404(已删除)(route 与 resend 依赖一并移除,lib/env.ts 与 .env.local 同步清理)
- [x] 弹窗拦截场景(浏览器拦截 window.open)有兜底跳转(window.open 返回 null 时 window.location.href 兜底)
- [x] zh/en 双语言截图验证四个页面;`pnpm lint`、`pnpm build` 通过(桌面截图:about/subscribe 正常;法律页 en 提示条+锚点目录验证;build 594/594(删除 api 路由后 -1);lint 零新增)

## 执行附注(2026-09-10)

- 法律页抽共享 LegalPage 组件:locale 化 metadata(canonical+hreflang)+ 锚点目录 + text-pretty + en 路由中文-only 提示条(#6/#7/#15/#17)。
- SubstackEmbed:删除无调用方的 iframe variant(#16);表单 h-11/size-lg 命中区 + 纵向堆叠移动布局(#9);name/aria-label 本地化(#8)。
- 订阅卡片改边框驱动(rounded-xl + 内 rounded-lg 同心圆角),Check 用 text-primary(#12/#13/#14)。
