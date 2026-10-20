# 动态 OG 分享卡

**优先级**:P2 | **类型**:feat/增长 | **创建**:2026-10-20

## 背景

当前 OG 策略（`lib/seo.ts:22,166`）：文章有封面用 R2 原图（尺寸/构图不可控，社交平台裁切后观感随机），无封面全站回退同一张静态 `/og-image.png`。社交分享是博客获客杠杆，标准化 1200×630 带标题卡片显著优于裸图。

## Requirements

- 用 `next/og`（ImageResponse）实现 `opengraph-image` 动态生成：
  - 路由方案：`app/[locale]/article/[slug]/opengraph-image.tsx`（`generateImageMetadata` 按文章生成，edge runtime）
  - 版式：深色底（#18181b）+ 琥珀金点缀 + serif 标题（自动折行/截断）+ 作者署名 + 站点标识，遵循 DESIGN.md 排印
  - 文章有封面时封面作为背景/右侧图（`next/image` 不可用，直接 fetch 远程图作为 ImageResponse 子元素需评估可行性与构建耗时；不可行则纯排印卡，同样达标）
- `lib/seo.ts` 文章 metadata 的 OG images 指向动态卡（保留封面入参逻辑与否在实现时定夺，社交卡统一走动态卡）
- 静态 `/og-image.png` 保留作为非文章页回退
- 中文字体：ImageResponse 需要字体子集（Google Fonts CJK 裁剪或复用站内字体），注意 bundle 与构建时间
- ISR：与文章页同频 revalidate 3600

## Acceptance Criteria

- [x] 文章页 `og:image` 指向动态卡，浏览器直访该 URL 返回 1200×630 PNG，中文标题完整渲染无豆腐块
- [x] https://www.opengraph.xyz 或等效工具验证卡片在 X/Telegram 预览正常
- [x] 构建时间无明显劣化（对比当前基线）
- [x] 改动文件 ESLint 零新增 error
