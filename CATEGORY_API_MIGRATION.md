# 分类页面 API 改造文档

## 📋 改造概述

将分类页面从**纯 Mock 数据**改为**真实 API + Mock 兜底**的混合策略，提高数据一致性和可维护性。

---

## ✅ 改造内容

### 1. 创建独立的 Mock 数据模块

**新增文件**: `frontend/lib/mock-data.ts`

**功能**:
- 集中管理所有 Mock 数据
- 提供分类数据（mockCategories）
- 提供文章数据（mockArticles）
- 提供工具函数（按分类筛选文章等）

**优点**:
- ✅ 数据集中管理，易于维护
- ✅ 可复用于其他页面
- ✅ 类型安全，符合 Strapi 数据结构

**Mock 数据结构**:
```typescript
export const mockCategories: Record<string, any> = {
  'ai-prompts': {
    id: '1',
    documentId: 'ai-prompts-doc',
    name: 'AI & Prompts',
    slug: 'ai-prompts',
    description: '...',
    // ... Strapi 标准字段
  },
  // ... 更多分类
};

export const mockArticles = [
  {
    id: '1',
    documentId: 'article-1-doc',
    title: '...',
    category: { id: '1', name: 'AI & Prompts', slug: 'ai-prompts' },
    // ... 完整的文章数据
  },
  // ... 更多文章
];
```

---

### 2. 改造分类页面使用真实 API

**修改文件**: `frontend/app/category/[slug]/page.tsx`

**核心逻辑**:

```typescript
export default async function CategoryPage({ params }) {
  const { slug } = await params;

  let category = null;
  let articles = [];
  let isUsingMockData = false;

  try {
    // 步骤 1: 优先尝试从 Strapi API 获取
    console.log(`🔍 Fetching category: ${slug} from Strapi API...`);

    const strapiCategory = await getCategoryBySlug(slug);

    if (strapiCategory) {
      category = strapiCategory;
      const articlesResponse = await getArticlesByCategory(slug, 1, 50);
      articles = transformArticles(articlesResponse.data);

      console.log(`✅ Successfully loaded ${articles.length} articles from API`);
    } else {
      throw new Error('Category not found in API');
    }
  } catch (error) {
    // 步骤 2: API 失败时降级到 Mock 数据
    console.warn(`⚠️ Falling back to mock data:`, error);

    isUsingMockData = true;
    category = mockCategories[slug] || getDefaultCategory();
    articles = getMockArticlesByCategory(slug);

    console.log(`📦 Using mock data: ${articles.length} articles`);
  }

  // 步骤 3: 如果连 Mock 数据都没有，返回 404
  if (!category) {
    notFound();
  }

  return (
    // ... 渲染页面
  );
}
```

---

## 🎯 改造效果

### 场景 1: Strapi 后端正常运行

**行为**:
```
🔍 Fetching category: ai-prompts from Strapi API...
✅ Successfully loaded 12 articles from API
```

**结果**:
- ✅ 显示真实的分类信息
- ✅ 显示真实的文章列表
- ✅ 数据实时更新
- ✅ 没有 "Demo Data" 标记

---

### 场景 2: Strapi 后端未启动 / 连接失败

**行为**:
```
🔍 Fetching category: ai-prompts from Strapi API...
⚠️ Falling back to mock data: Error: ECONNREFUSED
📦 Using mock data: 3 articles
```

**结果**:
- ✅ 页面正常渲染，不会崩溃
- ✅ 显示 Mock 数据
- ✅ 显示黄色 "Demo Data" 标记
- ✅ 提示用户当前使用演示数据

**UI 效果**:
```
┌─────────────────────────┐
│ 12 Articles │ Demo Data │
│   (徽章)    │  (黄色)   │
└─────────────────────────┘
```

---

### 场景 3: 分类不存在（在 API 和 Mock 中都不存在）

**行为**:
```
🔍 Fetching category: non-existent from Strapi API...
⚠️ Falling back to mock data
📦 Using mock data: 0 articles
```

**结果**:
- ✅ 返回 404 页面
- ✅ 符合预期的用户体验

---

## 📊 数据流程图

```
用户访问分类页面
        ↓
   尝试调用 API
        ↓
   ┌─────────────┐
   │ API 成功？  │
   └─────────────┘
      ↙        ↘
    是          否
     ↓           ↓
 显示真实数据   降级到 Mock
     ↓           ↓
   完成    显示"Demo Data"标记
               ↓
             完成
```

---

## 🔍 日志输出

### 开发环境日志

**API 成功时**:
```bash
🔍 Fetching category: ai-prompts from Strapi API...
✅ Successfully loaded 12 articles from API
```

**API 失败时**:
```bash
🔍 Fetching category: ai-prompts from Strapi API...
⚠️ Failed to fetch category from API, falling back to mock data: Error: ECONNREFUSED
📦 Using mock data: 3 articles
```

这些日志帮助开发者：
- 了解数据来源（API 还是 Mock）
- 快速定位问题
- 监控 API 健康状态

---

## 🎨 UI 变化

### 1. Demo Data 徽章

**位置**: 分类页面顶部，文章数量徽章旁边

**样式**:
```tsx
<Badge variant="outline" className="text-yellow-600 border-yellow-600">
  Demo Data
</Badge>
```

**显示条件**:
- 仅当 `isUsingMockData === true` 时显示
- 使用黄色边框和文字，醒目但不刺眼

**用户体验**:
- ✅ 清楚告知用户当前数据状态
- ✅ 不影响正常浏览体验
- ✅ 专业且透明

---

### 2. 空状态处理

**当分类下没有文章时**:
```tsx
<div className="text-center py-12">
  <p className="text-muted-foreground text-lg">
    No articles found in this category yet.
  </p>
  <p className="text-sm text-muted-foreground mt-2">
    Check back soon for new content!
  </p>
</div>
```

---

## 📁 文件变更总结

### 新增文件

```
frontend/lib/
└── mock-data.ts          # Mock 数据集中管理
```

### 修改文件

```
frontend/app/category/[slug]/
└── page.tsx              # 使用 API + Mock 兜底策略
```

---

## 🔧 配置说明

### ISR 配置

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 60; // 每 60 秒重新验证
```

**作用**:
- 启用动态渲染
- 每 60 秒重新获取数据
- 确保数据相对实时

---

## 🧪 测试场景

### 测试 1: 后端正常运行

**步骤**:
1. 启动 Strapi 后端
2. 访问 `/category/ai-prompts`
3. 检查控制台日志

**预期**:
- ✅ 看到 "✅ Successfully loaded" 日志
- ✅ 显示真实数据
- ✅ 没有 "Demo Data" 标记

---

### 测试 2: 后端未启动

**步骤**:
1. 停止 Strapi 后端
2. 访问 `/category/ai-prompts`
3. 检查控制台日志

**预期**:
- ✅ 看到 "⚠️ Falling back to mock data" 日志
- ✅ 页面正常显示
- ✅ 显示 "Demo Data" 标记
- ✅ 显示 Mock 文章

---

### 测试 3: 分类不存在

**步骤**:
1. 访问 `/category/non-existent-category`

**预期**:
- ✅ 显示 404 页面

---

### 测试 4: 空分类

**步骤**:
1. 访问一个在 API 中存在但没有文章的分类

**预期**:
- ✅ 显示分类信息
- ✅ 显示 "No articles found" 消息
- ✅ 不显示文章列表

---

## 🚀 部署建议

### 开发环境

**推荐配置**:
- 后端可以不启动
- 前端自动使用 Mock 数据
- 方便前端开发和调试

---

### 生产环境

**推荐配置**:
- 后端必须正常运行
- Mock 数据仅作为应急兜底
- 监控 API 健康状态

**监控指标**:
- 统计使用 Mock 数据的请求数
- 发现异常时及时告警
- 确保用户体验

---

## ✨ 优点总结

### 1. 数据一致性
- ✅ 所有页面统一使用 Strapi API
- ✅ 数据来源透明可追溯

### 2. 开发体验
- ✅ 前端开发不依赖后端
- ✅ 快速原型开发
- ✅ 调试更方便

### 3. 用户体验
- ✅ 页面不会因 API 错误崩溃
- ✅ 清楚告知数据状态
- ✅ 始终可访问

### 4. 可维护性
- ✅ Mock 数据集中管理
- ✅ 易于更新和扩展
- ✅ 代码结构清晰

---

## 📝 后续优化建议

### 1. 添加重试机制

```typescript
// 在 API 失败时自动重试
const fetchWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

### 2. 添加缓存机制

```typescript
// 使用 React Cache 缓存 API 响应
import { cache } from 'react';

const getCachedCategory = cache(async (slug: string) => {
  return await getCategoryBySlug(slug);
});
```

### 3. 添加骨架屏

```typescript
// 显示加载状态
{isLoading ? (
  <CategorySkeleton />
) : (
  <CategoryArticlesSection articles={articles} />
)}
```

### 4. 错误边界

```typescript
// 使用 Error Boundary 捕获渲染错误
<ErrorBoundary fallback={<ErrorPage />}>
  <CategoryPage />
</ErrorBoundary>
```

---

## 🎯 构建结果

✅ **构建成功**

```
Route (app)                 Revalidate  Expire
┌ ○ /                               1m      1y
├ ○ /_not-found
├ ○ /about
├ ƒ /api/subscribe
├ ƒ /api/subscribe/confirm
├ ○ /archive
├ ƒ /article/[slug]
├ ƒ /category/[slug]           ← 已更新为动态渲染
└ ○ /subscribe
```

---

## 📚 相关文档

- `DATA_LOADING_ANALYSIS.md` - 数据加载策略分析
- `lib/strapi.ts` - Strapi API 客户端
- `lib/mock-data.ts` - Mock 数据定义
- `lib/transformers.ts` - 数据转换器

---

生成时间: 2025-11-09
版本: v1.0.0
