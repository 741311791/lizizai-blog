# Design System — lizizai-blog

## Product Context
- **What this is:** 中文 AI 博客平台，Next.js 16 App Router + 飞书 CMS + Cloudflare 边缘部署
- **Who it's for:** 关注 AI 的中文技术读者，需要高质量深度内容的开发者/研究者/决策者
- **Space/industry:** AI/科技媒体、中文技术博客
- **Project type:** 内容发布平台（编辑/杂志风）

## Aesthetic Direction
- **Direction:** Editorial/Tech — 编辑杂志风 + 科技质感
- **Decoration level:** minimal — 排版做所有工作，无装饰性元素
- **Mood:** 沉静、专业、有编辑感。不是 SaaS 的密集信息布局，是"内容即设计"的路线。打开一篇文章，感觉像翻开一本高质量的科技杂志
- **Reference sites:** The Verge (dark), Linear Blog, Every.to

## Typography
- **Display/Hero (中文):** Noto Serif SC — 高质量中文衬线体，编辑感标题。技术博客中极少使用，辨识度高
- **Display/Hero (英文):** Satoshi — 几何感但有人味，不与 Noto Serif SC 冲突
- **Body (中文):** Noto Sans SC — 阅读性最强的中文无衬线体
- **Body (英文):** Instrument Sans — 比 Geist 暖，比 Inter 有性格
- **UI/Labels:** Instrument Sans (同 body 英文)
- **Data/Tables:** Instrument Sans (tabular-nums) — 数字等宽对齐
- **Code:** Geist Mono
- **Loading:** Google Fonts CDN，Noto Serif SC 仅加载 400/700/900 weight，Noto Sans SC 加载 400/500/600/700
- **Scale:**
  - Hero title (中文): 36px / weight 900 / line-height 1.3
  - Hero title (英文): 48px / weight 700 / line-height 1.1
  - Article title: 32px / weight 900 / line-height 1.35
  - Section heading (h2): 24px / weight 700 / line-height 1.4
  - Body (中文): 17px / weight 400 / line-height 1.8
  - Body (英文): 17px / weight 400 / line-height 1.7
  - Small/meta: 13px / weight 400 / line-height 1.5
  - Code: 14px / weight 400 / line-height 1.7
  - Badge/Label: 12px / weight 500-600

## Color
- **Approach:** restrained — 1 个琥珀金强调色 + 暖色中性色，颜色稀有且有含义
- **Primary/Accent:** `#d97706` (琥珀金) — 不是蓝/紫/绿，暖调、有辨识度、和 AI 主题不沾俗套。用于链接、标签、交互焦点
- **Accent hover:** `#f59e0b` (亮金) — hover/active 状态
- **Background:** `#09090b` — 近纯黑，带一丝蓝
- **Surface:** `#18181b` — 卡片/容器底色
- **Surface elevated:** `#27272a` — 悬浮元素、hover 背景
- **Text primary:** `#fafaf9` — 暖白，不是纯白 #fff（纯白在深色模式刺眼）
- **Text secondary:** `#a8a29e` — 暖灰，正文辅助色
- **Text muted:** `#78716c` — 更淡的暖灰，时间戳/标签/元信息
- **Border:** `#27272a` — 微妙的分隔线
- **Border hover:** `#3f3f46` — hover 态边框
- **Semantic:** success `#22c55e`, warning `#eab308`, error `#ef4444`, info `#06b6d4`
- **Dark mode:** 已是深色模式项目，不需要 light/dark 切换。保持纯深色

### OKLCH 转换参考（用于 Tailwind CSS v4 @theme）
```
--color-background: oklch(0.141 0.004 286);       /* #09090b */
--color-foreground: oklch(0.985 0.001 106);        /* #fafaf9 暖白 */
--color-card: oklch(0.21 0.006 286);               /* #18181b */
--color-primary: oklch(0.666 0.157 58);             /* #d97706 琥珀金 */
--color-primary-foreground: oklch(0.15 0 0);        /* 深色文字 */
--color-secondary: oklch(0.274 0.006 286);          /* #27272a 暖色中性面 */
--color-muted: oklch(0.274 0.006 286);              /* #27272a */
--color-muted-foreground: oklch(0.553 0.012 58);    /* #78716c 暖灰 */
--color-accent: oklch(0.274 0.01 58);               /* 暖色交互悬停面 */
--color-accent-foreground: oklch(0.985 0.001 106);
--color-destructive: oklch(0.704 0.191 22);
--color-border: oklch(0.274 0.006 286);             /* #27272a */
--color-ring: oklch(0.666 0.157 58);                /* 同 primary */
```

## Spacing
- **Base unit:** 8px
- **Density:** comfortable — 博客以阅读舒适度优先
- **Scale:** 2xs(4) xs(8) sm(12) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **文章正文行高:** 1.8，段落间距 24px
- **阅读区最大宽度:** 680px（中文最佳阅读宽度）

## Layout
- **Approach:** grid-disciplined + editorial touches — 内容页严格网格，首页可有编辑式布局
- **Grid:** 12 列，文章页 680px 居中阅读区
- **Max content width:** 1200px
- **Border radius:**
  - sm: 4px (code inline)
  - md: 8px (cards, inputs, buttons)
  - lg: 12px (modal, featured card)
  - full: 9999px (badges, avatar)

## Motion
- **Approach:** minimal-functional — 仅做有助于理解的过渡
- **Easing:** enter(cubic-bezier(0.16, 1, 0.3, 1)) exit(cubic-bezier(0.4, 0, 1, 1))
- **Duration:** micro(80ms) short(200ms) medium(300ms)
- **应用场景:** 页面切换淡入、列表项错开入场、交互状态过渡

## Risks Taken
| Risk | What it is | Why it works | What it costs |
|------|-----------|-------------|---------------|
| 中文衬线标题 | Noto Serif SC 做标题字体 | 编辑感，中文技术博客几乎没人用 | CJK 字体约 2MB+ 加载 |
| 琥珀金强调色 | 不用蓝/紫/绿 | 在 AI 领域 90% 用蓝紫，金色立刻辨识 | 少了"科技感"，多了"编辑感" |
| 680px 阅读宽度 | 比常见值窄 | 中文阅读最佳宽度 | 桌面端两侧留白大 |

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-02 | Initial design system created | Created by /design-consultation, editorial magazine direction for Chinese AI blog |
