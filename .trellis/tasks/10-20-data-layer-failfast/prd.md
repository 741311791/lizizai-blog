# 数据层软失败对齐

**优先级**:P1 | **类型**:fix | **创建**:2026-10-20

## 背景

`lib/blog-data.ts` 顶部哲学明确"避免静默返回空数据导致空站假象并被 ISR 缓存"（`getAllArticles` 已抛 `BlogDataUnavailableError`），但同文件存在两处软失败与之矛盾：

1. **`getArticleContent`（lib/blog-data.ts:160）**：`!res.ok` 静默返回 `''` → 标题/封面/评论区俱全但正文空白的文章页以 200 被 ISR 缓存 3600s，读者与作者均无感知。同步链路故障（R2 部分对象缺失、5xx）时最易触发。
2. **`getCategories`（lib/blog-data.ts:142）**：`!res.ok` 静默返回 `[]` → 导航/页脚/分类页空转并被 ISR 缓存。

## Requirements

- `getArticleContent`：
  - 5xx/429/网络异常 → 抛 `BlogDataUnavailableError`（复用 `fetchWithRetry` 已抛异常路径，外层 catch 包装后向上抛）
  - 404（文章确无正文，如纯播客/幻灯片形态）→ 维持返回 `''`（合法状态）
- `getCategories`：`!res.ok` 与网络异常 → 抛 `BlogDataUnavailableError`（与 `getAllArticles` 完全对齐，含 console.error 留痕）
- 错误页兜底已有：`app/[locale]/error.tsx` 呈现错误与重试，无需新增页面
- 禁止改动 `getAllArticles` / `getSlidesData` 以外函数的返回语义（`getSlidesData` 空 slides 属合法降级，维持现状）

## Acceptance Criteria

- [x] 代码走查：两处软失败均按上述语义处理，无新增静默空返回
- [x] `npx tsx lib/__tests__/blog-data.test.ts` 通过；如测试依赖"categories 失败返回空数组"语义则同步更新测试
- [x] 改动文件 ESLint 零新增 error
- [x] `pnpm dev` 下文章页/首页/分类页正常渲染（R2 可达时）
