# Mock 数据结构修复总结

## 🐛 问题描述

访问 `/category/ai-prompts` 页面时出现 500 错误：

```
⨯ TypeError: imageUrl.includes is not a function
    at ArticleListItem (components/article/ArticleListItem.tsx:170:37)
```

---

## 🔍 问题原因

### 根本原因

Mock 数据的结构与前端预期的数据格式不一致。

### 详细分析

1. **`transformArticle` 函数期望的格式**:
   ```typescript
   // 转换后的格式
   {
     featuredImage: 'https://example.com/image.jpg', // 字符串
     author: {
       name: 'Author Name',
       avatar: 'https://example.com/avatar.jpg' // 字符串
     }
   }
   ```

2. **Mock 数据原来的格式**（错误）:
   ```typescript
   {
     featuredImage: {
       url: 'https://picsum.photos/seed/cat1/800/600', // 对象！
       alternativeText: 'Featured image',
     },
     author: {
       name: 'DAN KOE',
       avatar: {
         url: 'https://picsum.photos/seed/author/200/200', // 对象！
       },
     }
   }
   ```

3. **`getArticleImageUrl` 函数的实现**:
   ```typescript
   export function getArticleImageUrl(
     featuredImage: string | undefined, // 期望字符串
     articleId: string
   ): string {
     return featuredImage || generatePlaceholderImage(articleId);
   }
   ```

4. **错误发生位置**:
   ```tsx
   <Image
     src={imageUrl}
     unoptimized={imageUrl.includes('picsum.photos')} // imageUrl 是对象，没有 includes 方法
   />
   ```

---

## ✅ 解决方案

### 修改 Mock 数据结构

将 `featuredImage` 和 `author.avatar` 从对象改为字符串。

**修改前**:
```typescript
featuredImage: {
  url: 'https://picsum.photos/seed/cat1/800/600',
  alternativeText: 'Featured image',
},
author: {
  name: 'DAN KOE',
  avatar: {
    url: 'https://picsum.photos/seed/author/200/200',
  },
}
```

**修改后**:
```typescript
featuredImage: 'https://picsum.photos/seed/cat1/800/600',
author: {
  name: 'DAN KOE',
  avatar: 'https://picsum.photos/seed/author/200/200',
}
```

---

## 📊 修改对比

### 数据流程

#### Strapi API 数据流
```
Strapi 原始数据
  ↓
transformArticle() 转换
  ↓
{
  featuredImage: string,
  author: { avatar: string }
}
  ↓
前端组件使用
```

#### Mock 数据流（修复后）
```
Mock 数据（已修复格式）
  ↓
直接使用（格式已匹配）
  ↓
{
  featuredImage: string,
  author: { avatar: string }
}
  ↓
前端组件使用
```

---

## 🎯 修复效果

### 修复前
```bash
⨯ TypeError: imageUrl.includes is not a function
GET /category/ai-prompts 500 in 148ms
```

### 修复后
```bash
✓ Compiled successfully
 GET /category/ai-prompts 200 in 5.1s
```

---

## 🔧 修改的文件

**文件**: `frontend/lib/mock-data.ts`

**修改内容**:
- 将所有 6 篇 Mock 文章的 `featuredImage` 改为字符串
- 将所有 Mock 文章的 `author.avatar` 改为字符串
- 移除不必要的嵌套对象结构

**行数**: 约 140 行改动

---

## ✨ 改进点

### 1. 数据一致性
- ✅ Mock 数据格式与 Strapi API 转换后的格式完全一致
- ✅ 不需要额外的数据转换逻辑
- ✅ 减少了类型不匹配的风险

### 2. 代码简洁性
- ✅ 移除了不必要的嵌套对象
- ✅ Mock 数据更易读、更易维护
- ✅ 与实际使用的数据格式直接对应

### 3. 开发体验
- ✅ 后端未启动时，前端也能正常显示
- ✅ Mock 数据可直接用于测试和演示
- ✅ 减少了调试时间

---

## 📝 经验教训

### 1. Mock 数据应该匹配实际使用的格式

**原则**:
- Mock 数据应该模拟的是**转换后**的数据，而不是原始 API 响应
- 如果有 transformer，Mock 数据应该匹配 transformer 的输出格式

**示例**:
```typescript
// ❌ 错误：模拟 Strapi 原始格式
const mockArticle = {
  featuredImage: { url: '...' } // Strapi 原始格式
};

// ✅ 正确：模拟转换后的格式
const mockArticle = {
  featuredImage: '...' // transformArticle 输出格式
};
```

### 2. 类型检查的重要性

如果使用 TypeScript 严格模式，这类问题会在编译时被发现：

```typescript
// 定义明确的类型
interface Article {
  featuredImage?: string; // 明确是字符串
  author: {
    name: string;
    avatar?: string; // 明确是字符串
  };
}

// Mock 数据必须符合类型
const mockArticle: Article = {
  featuredImage: { url: '...' } // 类型错误！编译器会报错
};
```

### 3. 测试的必要性

**建议添加的测试**:
```typescript
// 测试 Mock 数据格式
test('mock articles should match Article type', () => {
  mockArticles.forEach(article => {
    expect(typeof article.featuredImage).toBe('string');
    expect(typeof article.author.avatar).toBe('string');
  });
});
```

---

## 🧪 验证步骤

### 1. 构建测试
```bash
cd frontend
pnpm run build
```
**结果**: ✅ 构建成功，无错误

### 2. 运行时测试
```bash
pnpm run dev
```
**访问**: `/category/ai-prompts`
**结果**: ✅ 页面正常显示，Mock 数据加载成功

### 3. 控制台日志
```bash
🔍 Fetching category: ai-prompts from Strapi API...
⚠️ Category not found in API, using mock data...
📦 Using mock data: 1 articles
GET /category/ai-prompts 200 in 5.1s
```
**结果**: ✅ 兜底逻辑正常工作

---

## 🎯 后续建议

### 1. 添加类型定义

**建议创建**: `frontend/types/mock.ts`

```typescript
import { Article } from '@/types/strapi';

// Mock 数据应该严格遵循 Article 类型
export const mockArticles: Article[] = [
  // ...
];
```

### 2. 添加数据验证

```typescript
// 在开发环境验证 Mock 数据格式
if (process.env.NODE_ENV === 'development') {
  mockArticles.forEach((article, index) => {
    if (typeof article.featuredImage !== 'string' && article.featuredImage !== undefined) {
      console.error(`Mock article ${index} has invalid featuredImage format`);
    }
  });
}
```

### 3. 文档化 Mock 数据规范

在 `lib/mock-data.ts` 顶部添加注释：

```typescript
/**
 * Mock 数据规范
 *
 * 注意：Mock 数据应该匹配 transformArticle() 的输出格式，而不是 Strapi 原始格式
 *
 * 正确的格式：
 * - featuredImage: string | undefined
 * - author.avatar: string | undefined
 *
 * 错误的格式：
 * - featuredImage: { url: string } ❌
 * - author.avatar: { url: string } ❌
 */
```

---

## 📚 相关文档

- `DATA_LOADING_ANALYSIS.md` - 数据加载策略分析
- `CATEGORY_API_MIGRATION.md` - 分类页面 API 改造文档
- `lib/transformers.ts` - 数据转换器实现
- `lib/mock-data.ts` - Mock 数据定义

---

## ✅ 构建结果

```
Route (app)                 Revalidate  Expire
┌ ○ /                               1m      1y
├ ○ /_not-found
├ ○ /about
├ ƒ /api/subscribe
├ ƒ /api/subscribe/confirm
├ ○ /archive
├ ƒ /article/[slug]
├ ƒ /category/[slug]           ← 修复成功
└ ○ /subscribe

✓ Compiled successfully
```

---

生成时间: 2025-11-09
状态: ✅ 已修复
版本: v1.0.1
