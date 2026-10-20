# 品牌化默认封面

**优先级**:P2 | **类型**:feat/品牌 | **创建**:2026-10-20

## 背景

封面缺失时生产环境展示 `picsum.photos` 随机 stock 图（`lib/utils/image.ts` `generatePlaceholderImage`），观感不可控且有外链依赖；`next.config.ts` 专门为它开了 remotePattern。附带 bug：函数接收 `width/height` 参数但未使用（固定拼 800/600）。

## Requirements

- 品牌化默认封面替换 picsum：
  - 首选：本地静态图 `public/covers/default-cover.{png|webp}`（深色底 + 琥珀金排印装饰，静态资产可被 CDN 缓存；若与动态 OG 任务产出风格统一更佳）
  - `getCardImageUrl` 无封面时返回本地默认封面
- 清理：移除 `next.config.ts` 中 `picsum.photos` remotePattern；移除/改写 `generatePlaceholderImage`（连同无效参数 bug 一并处理）
- 全仓 `rg picsum` 清零（代码引用层面）
- 核实 `shouldSkipImageOptimization` 对本地图路径的行为（本地图默认走 next/image 优化，确认无回归）

## Acceptance Criteria

- [x] 无封面文章卡片显示品牌默认封面（dev + 生产）
- [x] `rg -i picsum` 在 app/components/lib/next.config 零命中
- [x] 改动文件 ESLint 零新增 error
