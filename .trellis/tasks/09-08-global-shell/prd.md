# 全局外壳修复(布局/导航/搜索/错误页/i18n)

**优先级**:P1 | **父任务**:09-08-frontend-audit | **范围**:Header/Footer/MobileNav/搜索/语言切换/404/错误页/globals.css/ui 基础组件(影响全站)

## 修复清单

### HIGH

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `components/layout/Footer.tsx:36-41` | 页脚 `/recommendations` 与 `/sitemap` 两个链接指向不存在的路由,点击即 404(app/sitemap.ts 是 metadata 路由非页面) | 删除这两个链接;或补建对应页面 |

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 2 | `components/ui/logo.tsx:17-19` | Logo 渐变 `stopColor="hsl(var(--primary))"` 引用未定义变量(Tailwind v4 只有 `--color-primary`),stop-color 回退黑色,Logo 变黑块 | 改 `var(--color-primary)` 或写死 `oklch(0.666 0.157 58)` |
| 3 | `app/[locale]/layout.tsx:66,78` | `getMessages()` 全量 messages 序列化进每个页面 RSC payload,客户端只用少量命名空间 | `getMessages({ namespaces: [...] })` 按需传入(或按路由拆分) |
| 4 | `components/layout/Header.tsx:21-23,95` | SearchDialog 虽 next/dynamic 但无条件渲染,chunk 首屏 hydration 即拉取 | 改 `{searchOpen && <SearchDialog open onOpenChange={...}/>}` 真按需加载 |
| 5 | `components/search/usePagefind.ts:62-93` | 搜索无竞态守卫,慢的旧查询用过期结果覆盖新查询 | 递增 requestId 或 AbortController,resolve 时比对序号 |
| 6 | `app/error.tsx:26-56` | 根层 error.tsx 在 NextIntlClientProvider 外,文案硬编码英文("Something went wrong!"),全站中文语境断裂 | 迁 `app/[locale]/error.tsx`(可用 i18n)+ 新增 `app/global-error.tsx` 兜底;文案中文化 |
| 7 | `components/layout/Header.tsx:68-80` | 桌面导航 7 项 `absolute left-1/2` 绝对定位居中,768-1024px 区间与 Logo/右侧操作区重叠(en 文案更宽) | md 断点减少可见项或改 flex 布局,避免绝对居中重叠 |
| 8 | `transition-all` 清理(5 处):`Header.tsx:87`、`DailyNews.tsx:75`、`ArticlesSection.tsx:183`、`BackToTop.tsx:38`、`components/ui/button.tsx:8` | 禁令:transition 必须列出具体属性;Button 基类影响全站 | Button 改 `transition-[color,background-color,border-color,box-shadow,opacity,transform]`;BackToTop `transition-[transform,opacity]`;其余按需收敛(DailyNews/ArticlesSection 两处文件归各页任务时可顺手,本任务负责 button.tsx 与 Header/BackToTop) |
| 9 | `i18n/routing.ts:4` | **需产品决策**:defaultLocale 'en' 但站点内容/用户中文优先,`/` 以 en 渲染出现英文界面+中文内容混杂 | 决策:改 `defaultLocale: 'zh'`(推荐,内容全中文)或补全 en 全套 UI;与 allnot-found/error 文案策略联动 |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 10 | `app/globals.css:60-63` | 标题无 `text-wrap: balance`、正文无 `text-wrap: pretty` | `h1,h2,h3 { text-wrap: balance }`;正文容器 pretty |
| 11 | `components/layout/LanguageSwitcher.tsx:4,16` | 未使用的 `getPathname` 死导入;`router.replace` 使语言切换不可回退 | 删死导入;如需回退语义改 `router.push` |
| 12 | `components/layout/Header.tsx:14-20` | MobileNav 动态加载占位按钮 `aria-label="菜单"` 硬编码 | 用 useTranslations(nav.menu) |
| 13 | `app/[locale]/not-found.tsx:7-9` | 404 文案硬编码中文,en 用户仍见中文 | 迁 messages(notFound 命名空间) |
| 14 | `components/ui/social-links.tsx:16-21` | 社交图标命中区仅 ~18-20px(Footer/AboutMe 在用) | `p-2 -m-2` 扩命中(视觉不变)或加 padding 至 ≥40px |
| 15 | `components/layout/MobileNav.tsx:35` | 移动端唯一导航入口命中区 36px(`size-9`) | `className="size-11"`(44px) |
| 16 | `components/layout/MobileNav.tsx:39` | SheetContent 缺 SheetDescription,Radix 告警 aria-describedby | 加 sr-only 描述或 `aria-describedby={undefined}` |
| 17 | `app/globals.css:2` | KaTeX 全站 CSS(~25KB+)打进全局关键 CSS,首页无公式也阻塞渲染 | 移到文章详情局部引入(article layout 或 MarkdownContent 旁) |

## 需要决策

- **#9 defaultLocale**:建议改 'zh'。影响:无前缀路径变中文;en 用户走 /en。需同步检查 sitemap/hreflang/RSS 链接口径。

## 验收标准

- [x] ~~Logo 渐变色正常渲染(非黑块)~~ **用户决策覆盖(2026-09-10):保留原 Logo 样式不改,已还原 logo.tsx**
- [x] 页脚无死链;全站链接巡检无 404(curl 全部 200)
- [x] 首屏 Network:SearchDialog chunk 不在初始加载;Cmd+K 首次按下可加载并打开
- [x] 连续快速输入搜索词,结果始终对应最新关键词(requestId 竞态守卫,代码级修复)
- [x] 768/834/1024px 视口导航不与 Logo/按钮重叠(768/834 汉堡菜单、1024 桌面导航,均无重叠)
- [x] 制造一个渲染错误验证 error 页为中文且有重试;404 页随语言切换(应用内 404 zh/en 各自正确;另补根级 app/not-found.tsx)
- [x] `pnpm lint`、`pnpm build` 通过;`git diff` 确认未误改 globals.css 主题变量
