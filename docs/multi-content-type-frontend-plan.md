# 多内容类型前端适配改造计划

> 日期：2026-05-09
> 状态：待实施
> 前置文档：`docs/multi-content-type-sync.md`（阶段一已完成）

## 1. 背景与现状

### 已完成

同步层（Worker/GitHub Actions）已支持多内容类型（文章+播客+PPT），R2 数据中的 `contentTypes` 字段已正确写入。文章**详情页**的多内容类型展示已完善：

- `ContentTypeSwitcher` — 动态切换按钮
- `SlideViewer` — HTML iframe + Markdown 双模式
- `AudioPlayer` — 播客播放器
- `PodcastSidebar` / `SlidesSidebar` — 专用侧边栏
- `ArticleDetailClient` — 完整集成

### 核心问题

多内容类型的支持在**文章详情页**很完善，但在**列表、网格、首页**等用户发现内容的入口处缺失。用户在浏览文章列表时无法快速识别哪些是播客、哪些是幻灯片。

| 组件 | 当前状态 | 问题 |
|------|---------|------|
| `ArticleCard.tsx` | ✅ 已有类型标识 | — |
| `ArticleListItem.tsx` | ❌ 无类型标识 | 只显示分类，不区分播客/PPT |
| `ArticlesSection.tsx` GridCard | ❌ 无类型标识 | 只显示分类名称 |
| `Hero.tsx` | ❌ 无类型标识 | 精选文章不区分类型 |
| `DailyNews.tsx` NewsCard | ❌ 无类型标识 | 资讯卡片不区分类型 |

---

## 2. 改造目标

在用户**发现内容**的所有入口（首页、列表页、分类页、归档页）中，清晰展示文章的内容类型，帮助用户快速识别播客和 PPT 内容。

### 设计原则

- **统一标识**：所有文章展示位置使用一致的 `ContentTypeBadge` 视觉语言
- **复用优先**：提取公共组件，避免重复代码
- **渐进增强**：不破坏现有布局，仅添加类型标识层
- **参考基准**：`ArticleCard.tsx` 已有的实现是改造范本

---

## 3. 任务分解

### 任务 1：提取公共类型标识组件

**文件**：`components/article/ContentTypeBadge.tsx`（已存在）

**当前实现**：仅在详情页使用，接收 `contentType` 字符串。

**改造**：扩展为所有列表/卡片场景复用的统一组件。

```typescript
// 改造后的 Props
interface ContentTypeBadgeProps {
  contentType?: ContentType;      // 'article' | 'podcast' | 'slides'
  compact?: boolean;              // 紧凑模式（列表项用）
  className?: string;
}
```

**显示逻辑**：

| contentType | 图标 | 文字 | compact 模式 |
|-------------|------|------|-------------|
| `podcast` | 🎙️ | 播客 | 🎙️ 播客 |
| `slides` | 📊 | PPT | 📊 {n} 页 |
| `article` / undefined | — | — | 不显示 |

compact 模式用于列表项等空间有限的场景，仅显示图标+简短文字。

---

### 任务 2：改造 ArticleListItem

**文件**：`components/article/ArticleListItem.tsx`

**变更**：

1. 导入 `ContentTypeBadge`
2. 在文章标题右侧（或分类标签位置）添加类型标识
3. 调整时间描述：
   - `podcast` → "X 分钟收听"
   - `slides` → "X 张幻灯片"
   - `article` → "X 分钟阅读"（不变）

**参考实现**：`ArticleCard.tsx` 中的逻辑（L45-L60）。

---

### 任务 3：改造 ArticlesSection GridCard

**文件**：`components/article/ArticlesSection.tsx`

**变更**：

1. `GridCard` 内部添加 `ContentTypeBadge`
2. 调整时间描述逻辑（同任务 2）
3. 考虑将 `GridCard` 的类型标识逻辑抽取为独立的小组件，避免与 `ArticleCard` 重复代码

**备选方案**：直接复用 `ArticleCard` 替换 `GridCard`（需评估布局差异）。

---

### 任务 4：改造 Hero 精选文章

**文件**：`components/home/Hero.tsx`

**变更**：

1. 在精选文章大图的标签区域，用 `ContentTypeBadge` 替代或补充 `category.name`
2. 调整时间描述（播客→收听时间，PPT→页数）
3. 可选：如果精选文章是播客/PPT，在卡片上增加视觉差异化（如播放按钮图标、幻灯片预览）

---

### 任务 5：改造 DailyNews 资讯卡片

**文件**：`components/home/DailyNews.tsx`

**变更**：

1. `NewsCard` 内部添加 `ContentTypeBadge`（compact 模式）
2. 调整时间描述

---

### 任务 6（可选）：内容类型筛选器

**新建文件**：`components/article/ContentTypeFilter.tsx`

**功能**：在分类页和归档页添加 "全部 / 文章 / 播客 / PPT" 筛选标签。

```typescript
interface ContentTypeFilterProps {
  activeFilter: ContentType | 'all';
  onFilterChange: (filter: ContentType | 'all') => void;
  counts: { all: number; article: number; podcast: number; slides: number };
}
```

**使用位置**：
- `app/[locale]/category/[slug]/page.tsx`
- `app/[locale]/archive/page.tsx`

**优先级**：低。核心改造（任务 1-5）完成后根据用户反馈决定是否实施。

---

## 4. 文件变更清单

| 文件 | 操作 | 任务 | 说明 |
|------|------|------|------|
| `components/article/ContentTypeBadge.tsx` | 修改 | 1 | 添加 compact 模式 |
| `components/article/ArticleListItem.tsx` | 修改 | 2 | 添加类型标识+调整时间描述 |
| `components/article/ArticlesSection.tsx` | 修改 | 3 | GridCard 添加类型标识 |
| `components/home/Hero.tsx` | 修改 | 4 | 精选文章添加类型标识 |
| `components/home/DailyNews.tsx` | 修改 | 5 | 资讯卡片添加类型标识 |
| `components/article/ContentTypeFilter.tsx` | 新建 | 6（可选） | 类型筛选器 |
| `messages/zh.json` | 修改 | — | 确认翻译键完整 |
| `messages/en.json` | 修改 | — | 确认翻译键完整 |

**不需要修改的文件**：
- `types/index.ts` — 类型定义已完整
- `lib/blog-data.ts` — 数据获取已适配
- `components/article/ArticleCard.tsx` — 已有实现，作为参考
- 文章详情页相关组件 — 已完善

---

## 5. 实施顺序与依赖

```
任务 1（ContentTypeBadge 扩展）
  ↓
任务 2（ArticleListItem）+ 任务 3（GridCard）+ 任务 4（Hero）+ 任务 5（DailyNews）
  ↓ （可并行）
任务 6（筛选器，可选）
```

---

## 6. 验证清单

### 列表展示

- [ ] 文章列表页：播客文章显示 🎙️ 播客标识 + 收听时间
- [ ] 文章列表页：PPT 文章显示 📊 PPT 标识 + 页数
- [ ] 文章列表页：普通文章显示阅读时间（不变）

### 网格展示

- [ ] 首页文章区块 GridCard：播客/PPT 文章有类型标识
- [ ] 网格卡片的时间描述根据类型调整

### 首页

- [ ] Hero 精选文章：播客/PPT 有类型标识
- [ ] DailyNews 资讯卡片：播客/PPT 有类型标识
- [ ] 首页整体布局未受影响

### 兼容性

- [ ] 无 `contentTypes` 的旧文章正常显示（无类型标识）
- [ ] 移动端布局正常（compact 模式不溢出）
- [ ] 暗色模式下类型标识清晰可辨
- [ ] 构建 `pnpm build` 无错误

---

## 7. 工作量估算

| 任务 | 预计时间 |
|------|---------|
| 任务 1：ContentTypeBadge 扩展 | 15 分钟 |
| 任务 2：ArticleListItem | 30 分钟 |
| 任务 3：ArticlesSection GridCard | 30 分钟 |
| 任务 4：Hero | 20 分钟 |
| 任务 5：DailyNews | 20 分钟 |
| 任务 6：ContentTypeFilter（可选） | 1 小时 |
| 测试验证 | 30 分钟 |
| **总计（核心）** | **约 2.5 小时** |
| **总计（含可选）** | **约 3.5 小时** |
