# 布局切换功能实现文档

## 功能概述

实现了文章列表的两种布局模式切换：
- **列表式布局（List View）** - 默认模式
- **卡片式布局（Grid View）** - 可选模式

用户的布局偏好会自动保存在 localStorage 中，下次访问时自动恢复。

---

## ✅ 已实现的功能

### 1. 列表式布局组件
**文件**: `frontend/components/article/ArticleListItem.tsx`

**特点**:
- 横向布局：左侧内容，右侧缩略图
- 更紧凑的空间利用
- 悬停时显示操作按钮（点赞、分享）
- 完整的交互功能（点赞、分享计数）
- 响应式图片尺寸（移动端 128px，桌面端 160px）

### 2. 布局切换控制组件
**文件**: `frontend/components/article/LayoutToggle.tsx`

**功能**:
- 提供 List 和 Grid 两个切换按钮
- 当前激活的按钮会高亮显示
- 使用 lucide-react 图标
- 简洁的视觉设计

### 3. 布局状态管理 Hook
**文件**: `frontend/hooks/useViewMode.ts`

**功能**:
- 管理布局模式状态（list/grid）
- 自动从 localStorage 读取用户偏好
- 自动保存用户的布局选择
- 默认使用列表式布局
- SSR 友好（避免水合错误）

### 4. 首页布局切换
**更新文件**:
- `frontend/app/page.tsx`
- `frontend/components/article/ArticlesSection.tsx`

**实现**:
- 将文章展示部分提取为客户端组件
- 支持 Latest、Top、Discussions 三个标签
- 每个标签都支持布局切换
- 布局偏好在所有标签间共享

### 5. 分类页面布局切换
**更新文件**:
- `frontend/app/category/[slug]/page.tsx`
- `frontend/components/article/CategoryArticlesSection.tsx`

**实现**:
- 将文章展示部分提取为客户端组件
- 支持 Latest、Top、Trending 三个排序方式
- 每个排序方式都支持布局切换
- 自动排序逻辑（按日期、点赞数、评论数）

---

## 🎨 UI 设计细节

### 列表式布局（List View）
```
┌─────────────────────────────────────────────────────────┐
│ 标题                                         [缩略图]    │
│ 副标题                                       [160x160]   │
│ 作者 · 日期  [❤️ 123] [↗️ 45]                          │
└─────────────────────────────────────────────────────────┘
```

**样式特点**:
- 横向布局，左右分栏
- 缩略图固定尺寸（桌面 160x160，移动 128x128）
- 标题最多显示 2 行
- 副标题最多显示 2 行
- 悬停时显示操作按钮和背景色变化

### 卡片式布局（Grid View）
```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ [图片]  │  │ [图片]  │  │ [图片]  │
│ 标题    │  │ 标题    │  │ 标题    │
│ 副标题  │  │ 副标题  │  │ 副标题  │
│ 信息    │  │ 信息    │  │ 信息    │
└─────────┘  └─────────┘  └─────────┘
```

**样式特点**:
- 网格布局（响应式列数）
- 垂直卡片设计
- 图片 16:9 比例
- 完整的卡片交互

### 布局切换按钮
```
┌──────────────────────────┐
│ [≡ List] [⊞ Grid]        │
└──────────────────────────┘
```

**位置**: Tabs 右侧
**样式**: 圆角边框容器 + 高亮激活状态

---

## 📁 文件结构

### 新增文件
```
frontend/
├── components/
│   └── article/
│       ├── ArticleListItem.tsx          # 列表式文章项
│       ├── ArticlesSection.tsx          # 首页文章区域
│       ├── CategoryArticlesSection.tsx  # 分类页文章区域
│       └── LayoutToggle.tsx             # 布局切换控制
└── hooks/
    └── useViewMode.ts                    # 布局状态管理 hook
```

### 修改文件
```
frontend/
└── app/
    ├── page.tsx                          # 首页
    └── category/
        └── [slug]/
            └── page.tsx                  # 分类页面
```

---

## 🔧 技术实现

### 状态管理流程
```typescript
1. 组件挂载
   ↓
2. useViewMode hook 初始化
   ↓
3. 从 localStorage 读取偏好
   ↓
4. 设置初始状态
   ↓
5. 渲染对应布局
   ↓
6. 用户切换布局
   ↓
7. 更新状态并保存到 localStorage
```

### 布局切换逻辑
```typescript
{viewMode === 'grid' ? (
  <ArticleGrid articles={articles} />
) : (
  <div className="space-y-0">
    {articles.map((article) => (
      <ArticleListItem key={article.id} article={article} />
    ))}
  </div>
)}
```

### LocalStorage 键
- **键名**: `article-view-mode`
- **值**: `'list'` | `'grid'`
- **默认值**: `'list'`

---

## 📊 响应式设计

### 列表式布局
| 屏幕尺寸 | 缩略图尺寸 | 布局调整 |
|---------|-----------|---------|
| 移动端 (< 640px) | 128x128px | 单列，紧凑间距 |
| 桌面端 (≥ 640px) | 160x160px | 单列，正常间距 |

### 卡片式布局（继承 ArticleGrid）
| 屏幕尺寸 | 列数 | 间距 |
|---------|------|------|
| 移动端 (< 640px) | 1 列 | 16px |
| 平板 (640px - 1024px) | 2 列 | 24px |
| 桌面端 (≥ 1024px) | 3 列 | 24px |

---

## 🎯 使用示例

### 在任意组件中使用
```typescript
'use client';

import { useViewMode } from '@/hooks/useViewMode';
import LayoutToggle from '@/components/article/LayoutToggle';
import ArticleListItem from '@/components/article/ArticleListItem';
import ArticleGrid from '@/components/article/ArticleGrid';

export default function MyArticleList({ articles }) {
  const [viewMode, setViewMode] = useViewMode('list');

  return (
    <div>
      <LayoutToggle viewMode={viewMode} onViewModeChange={setViewMode} />

      {viewMode === 'grid' ? (
        <ArticleGrid articles={articles} />
      ) : (
        <div className="space-y-0">
          {articles.map((article) => (
            <ArticleListItem key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 测试清单

- [x] 首页布局切换功能正常
- [x] 分类页面布局切换功能正常
- [x] 布局偏好正确保存到 localStorage
- [x] 刷新页面后偏好正确恢复
- [x] 列表式布局显示正常
- [x] 卡片式布局显示正常
- [x] 响应式设计正常工作
- [x] 点赞功能正常
- [x] 分享功能正常
- [x] TypeScript 类型检查通过
- [x] 项目构建成功

---

## 🎨 样式定制

### 修改列表项样式
编辑 `ArticleListItem.tsx`:
```typescript
<article className="group flex gap-6 py-6 border-b border-border hover:bg-accent/50 transition-colors -mx-4 px-4">
  {/* 修改 gap-6 调整左右间距 */}
  {/* 修改 py-6 调整上下间距 */}
  {/* 修改 hover:bg-accent/50 调整悬停背景色 */}
</article>
```

### 修改缩略图尺寸
```typescript
<div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
  {/* 修改 w-32 h-32 调整移动端尺寸 */}
  {/* 修改 w-40 h-40 调整桌面端尺寸 */}
</div>
```

### 修改切换按钮样式
编辑 `LayoutToggle.tsx`:
```typescript
<div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
  {/* 修改容器样式 */}
</div>
```

---

## 🔄 与现有功能的集成

### 点赞功能
- ✅ 完全集成
- ✅ 状态持久化
- ✅ 乐观更新

### 分享功能
- ✅ 完全集成
- ✅ 分享计数
- ✅ 下拉菜单

### 文章路由
- ✅ 完全支持
- ✅ 正确的链接跳转

---

## 📈 后续优化建议

### 1. 添加过渡动画
```typescript
// 在布局切换时添加淡入淡出效果
<div className={cn(
  "transition-all duration-300",
  viewMode === 'list' ? 'opacity-100' : 'opacity-0'
)}>
```

### 2. 添加骨架屏
```typescript
// 加载时显示占位符
{isLoading ? (
  <ArticleListSkeleton count={6} />
) : (
  <ArticleList articles={articles} />
)}
```

### 3. 虚拟滚动优化
```typescript
// 对于大量文章，使用虚拟滚动
import { useVirtualizer } from '@tanstack/react-virtual';
```

### 4. 无限滚动
```typescript
// 滚动到底部自动加载更多
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
```

---

## 🐛 已知问题

目前没有已知问题。

---

## 📝 更新日志

### v1.0.0 (2025-11-09)
- ✅ 实现列表式布局组件
- ✅ 实现布局切换控制
- ✅ 实现状态持久化
- ✅ 集成到首页
- ✅ 集成到分类页面
- ✅ 完整的响应式支持
- ✅ 构建测试通过

---

## 构建结果

✅ 项目构建成功，无错误

```
Route (app)                 Revalidate  Expire
┌ ○ /                               1m      1y
├ ○ /_not-found
├ ○ /about
├ ƒ /api/subscribe
├ ƒ /api/subscribe/confirm
├ ○ /archive
├ ƒ /article/[slug]
├ ƒ /category/[slug]
└ ○ /subscribe
```

---

生成时间: 2025-11-09
版本: v1.0.0
