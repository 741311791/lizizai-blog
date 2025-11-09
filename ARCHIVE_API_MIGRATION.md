# Archive 页面 API 迁移文档

## 📋 改造概述

将 Archive 页面从**纯 Mock 数据**改为**真实 API + Mock 兜底**的策略,与分类页面保持一致。

---

## ✅ 改造内容

### 1. 扩展 Mock 数据模块

**文件**: `frontend/lib/mock-data.ts`

**新增功能**:
- 添加 `mockArchive` 常量(按年月分组的归档数据)
- 添加 `groupArticlesByYearMonth()` 函数(将文章列表按年月组织)

**groupArticlesByYearMonth 函数**:
```typescript
export function groupArticlesByYearMonth(articles: any[]): Record<string, Record<string, any[]>> {
  const grouped: Record<string, Record<string, any[]>> = {};

  articles.forEach((article) => {
    const date = new Date(article.publishedAt);
    const year = date.getFullYear().toString();
    const month = date.toLocaleDateString('en-US', { month: 'long' });

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];

    grouped[year][month].push(article);
  });

  // 按年份降序、月份降序、日期降序排序
  // ...
  return result;
}
```

---

### 2. 改造 Archive 页面为服务端组件

**文件**: `frontend/app/archive/page.tsx`

**核心变更**:
1. **从客户端组件改为服务端组件** - 移除 `'use client'`
2. **优先使用 API 数据** - 调用 `getArticles()` 获取所有文章
3. **自动分组** - 使用 `groupArticlesByYearMonth()` 组织数据
4. **降级到 Mock** - API 失败时使用 `mockArchive`
5. **显示数据来源** - 使用 `isUsingMockData` 控制 "Demo Data" 标记

**核心逻辑**:
```typescript
export default async function ArchivePage() {
  let archiveData: Record<string, Record<string, any[]>> = {};
  let isUsingMockData = false;
  let totalArticles = 0;

  try {
    // 步骤 1: 从 Strapi API 获取所有文章
    console.log('🔍 Fetching all articles from Strapi API for archive...');

    const response = await getArticles({
      pageSize: 100,
      sort: 'publishedAt:desc',
    });

    const articles = transformArticles(response.data as any);

    if (articles && articles.length > 0) {
      archiveData = groupArticlesByYearMonth(articles);
      totalArticles = articles.length;
      console.log(`✅ Successfully loaded ${totalArticles} articles from API`);
    } else {
      throw new Error('No articles found in API');
    }
  } catch (error) {
    // 步骤 2: API 失败时降级到 Mock 数据
    console.warn('⚠️ Failed to fetch articles from API, falling back to mock data:', error);

    isUsingMockData = true;
    archiveData = mockArchive;

    // 计算 Mock 数据的文章总数
    totalArticles = Object.values(mockArchive).reduce(
      (yearTotal, months) =>
        yearTotal +
        Object.values(months).reduce(
          (monthTotal, articles) => monthTotal + articles.length,
          0
        ),
      0
    );

    console.log(`📦 Using mock data: ${totalArticles} articles`);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <header className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="secondary">{totalArticles} Articles</Badge>
          {isUsingMockData && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Demo Data
            </Badge>
          )}
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Archive
        </h1>
        <p className="text-xl text-muted-foreground">
          Browse all articles by date
        </p>
      </header>

      <Suspense fallback={<ArchiveContentSkeleton />}>
        <ArchiveContent archiveData={archiveData} />
      </Suspense>
    </div>
  );
}
```

---

### 3. 创建客户端组件处理搜索

**文件**: `frontend/components/archive/ArchiveContent.tsx`

**用途**: 将客户端交互(搜索功能)从服务端组件中分离

**关键特性**:
- 使用 `'use client'` 标记为客户端组件
- 接收服务端传递的 `archiveData` 作为 props
- 提供搜索框和过滤逻辑
- 按年月时间线显示文章

**核心代码**:
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Calendar, Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ArchiveContentProps {
  archiveData: Record<string, Record<string, any[]>>;
}

export default function ArchiveContent({ archiveData }: ArchiveContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filterArticles = (articles: any[]) => {
    if (!searchQuery) return articles;
    return articles.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <>
      {/* 搜索框 */}
      <div className="mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      {/* 归档时间线 */}
      <div className="space-y-12">
        {Object.entries(archiveData).map(([year, months]) => (
          <div key={year}>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              {year}
            </h2>

            <div className="space-y-8">
              {Object.entries(months).map(([month, articles]) => {
                const filteredArticles = filterArticles(articles);
                if (filteredArticles.length === 0) return null;

                return (
                  <div key={month}>
                    <h3 className="text-xl font-semibold mb-4 text-primary">
                      {month}
                    </h3>
                    <div className="space-y-4 pl-6 border-l-2 border-border">
                      {filteredArticles.map((article) => (
                        <div key={article.id} className="pl-6 -ml-px">
                          <Link href={`/article/${article.slug}`} className="block group">
                            {/* 文章信息 */}
                          </Link>
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 无结果提示 */}
      {searchQuery &&
        Object.values(archiveData).every((months) =>
          Object.values(months).every(
            (articles) => filterArticles(articles).length === 0
          )
        ) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No articles found matching "{searchQuery}"
            </p>
          </div>
        )}
    </>
  );
}
```

---

## 🎯 改造效果

### 场景 1: Strapi 后端正常运行

**行为**:
```bash
🔍 Fetching all articles from Strapi API for archive...
✅ Successfully loaded 15 articles from API
```

**结果**:
- ✅ 显示真实的文章数据
- ✅ 文章按年月自动分组
- ✅ 数据实时更新(每 60 秒重新验证)
- ✅ 没有 "Demo Data" 标记

**UI 效果**:
```
┌─────────────┐
│ 15 Articles │
└─────────────┘

Archive
Browse all articles by date

[搜索框]

📅 2025
  October
    - Article 1 (Oct 15)
    - Article 2 (Oct 09)

  July
    - Article 3 (Jul 25)
```

---

### 场景 2: Strapi 后端未启动 / 连接失败

**行为**:
```bash
🔍 Fetching all articles from Strapi API for archive...
⚠️ Failed to fetch articles from API, falling back to mock data: Error: ECONNREFUSED
📦 Using mock data: 6 articles
```

**结果**:
- ✅ 页面正常渲染,不会崩溃
- ✅ 显示 Mock 数据
- ✅ 显示黄色 "Demo Data" 标记
- ✅ 提示用户当前使用演示数据

**UI 效果**:
```
┌─────────────────────────┐
│ 6 Articles │ Demo Data  │
│  (灰色)    │  (黄色)    │
└─────────────────────────┘

Archive
Browse all articles by date

[搜索框]

📅 2025
  October
    - Mock Article 1
    - Mock Article 2
```

---

## 📊 数据流程图

```
用户访问 /archive
        ↓
   服务端渲染
        ↓
  调用 getArticles() API
        ↓
   ┌─────────────┐
   │ API 成功?   │
   └─────────────┘
      ↙        ↘
    是          否
     ↓           ↓
 转换数据    使用 mockArchive
     ↓           ↓
 按年月分组  已分组好的数据
     ↓           ↓
 传递给客户端组件
     ↓
 ArchiveContent 组件
     ↓
 提供搜索和显示
```

---

## 🔍 日志输出示例

### API 成功时

**服务端日志**:
```bash
🔍 Fetching all articles from Strapi API for archive...
✅ Successfully loaded 15 articles from API
```

**开发者工具**:
- Network 面板显示成功的 GraphQL 请求
- 页面顶部只显示 "15 Articles" 标记
- 没有 "Demo Data" 标记

---

### API 失败时

**服务端日志**:
```bash
🔍 Fetching all articles from Strapi API for archive...
⚠️ Failed to fetch articles from API, falling back to mock data: FetchError: request to http://localhost:1337/graphql failed, reason: connect ECONNREFUSED 127.0.0.1:1337
📦 Using mock data: 6 articles
```

**开发者工具**:
- Network 面板显示失败的 GraphQL 请求(红色)
- 页面顶部显示 "6 Articles" 和黄色 "Demo Data" 标记
- 控制台有警告日志(仅开发环境)

---

## 🎨 UI 变化

### 1. Demo Data 徽章

**位置**: Archive 页面顶部,文章数量徽章旁边

**样式**:
```tsx
<Badge variant="outline" className="text-yellow-600 border-yellow-600">
  Demo Data
</Badge>
```

**显示条件**:
- 仅当 `isUsingMockData === true` 时显示
- 使用黄色边框和文字,醒目但不刺眼

**用户体验**:
- ✅ 清楚告知用户当前数据状态
- ✅ 不影响正常浏览体验
- ✅ 专业且透明

---

### 2. 搜索功能

**特性**:
- 实时搜索,无需提交
- 搜索文章标题
- 自动过滤和隐藏空月份
- 显示 "无结果" 提示

**实现**:
```tsx
const filterArticles = (articles: any[]) => {
  if (!searchQuery) return articles;
  return articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
```

---

### 3. 时间线布局

**设计特点**:
- 年份大标题 + 日历图标
- 月份中标题(主题色)
- 左侧垂直边框线
- 文章卡片悬停效果
- 分隔线

**层级**:
```
📅 2025 (年份 - h2)
  └── October (月份 - h3)
      ├── Article 1
      ├── Article 2
      └── Article 3
  └── September (月份 - h3)
      ├── Article 4
      └── Article 5
```

---

## 📁 文件变更总结

### 修改文件

```
frontend/lib/
└── mock-data.ts         # 添加 mockArchive 和 groupArticlesByYearMonth()

frontend/app/archive/
└── page.tsx             # 改为服务端组件,使用 API + Mock 兜底
```

### 新增文件

```
frontend/components/archive/
└── ArchiveContent.tsx   # 客户端组件处理搜索和显示
```

---

## 🔧 配置说明

### ISR 配置

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 60; // 每 60 秒重新验证
```

**作用**:
- 启用动态渲染(每次请求都重新生成)
- 每 60 秒重新获取数据
- 确保数据相对实时

---

## 🧪 测试场景

### 测试 1: 后端正常运行

**步骤**:
1. 启动 Strapi 后端 (`cd backend && pnpm run develop`)
2. 访问 `/archive`
3. 检查浏览器控制台和终端日志

**预期**:
- ✅ 看到 "✅ Successfully loaded" 日志
- ✅ 显示真实数据
- ✅ 没有 "Demo Data" 标记
- ✅ 文章按年月正确分组

---

### 测试 2: 后端未启动

**步骤**:
1. 停止 Strapi 后端
2. 清除 `.next` 缓存 (`rm -rf .next`)
3. 访问 `/archive`
4. 检查浏览器控制台和终端日志

**预期**:
- ✅ 看到 "⚠️ Falling back to mock data" 日志
- ✅ 页面正常显示
- ✅ 显示黄色 "Demo Data" 标记
- ✅ 显示 Mock 文章(6 篇)

---

### 测试 3: 搜索功能

**步骤**:
1. 访问 `/archive`
2. 在搜索框输入关键词
3. 观察文章列表变化

**预期**:
- ✅ 实时过滤文章
- ✅ 空月份自动隐藏
- ✅ 无结果时显示提示消息
- ✅ 清空搜索恢复全部显示

---

### 测试 4: 骨架屏

**步骤**:
1. 访问 `/archive`
2. 观察初始加载状态

**预期**:
- ✅ 显示骨架屏动画
- ✅ 数据加载后自动替换
- ✅ 过渡平滑

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
- ✅ 与分类页面使用相同的兜底策略
- ✅ 数据来源透明可追溯
- ✅ 统一的数据转换逻辑

### 2. 开发体验
- ✅ 前端开发不依赖后端
- ✅ 快速原型开发
- ✅ 调试更方便

### 3. 用户体验
- ✅ 页面不会因 API 错误崩溃
- ✅ 清楚告知数据状态
- ✅ 始终可访问
- ✅ 搜索功能增强可用性

### 4. 可维护性
- ✅ 服务端/客户端职责分离
- ✅ Mock 数据集中管理
- ✅ 易于更新和扩展
- ✅ 代码结构清晰

---

## 📝 与分类页面的对比

| 特性 | 分类页面 | Archive 页面 |
|------|---------|--------------|
| 数据获取 | `getArticlesByCategory()` | `getArticles()` 全部文章 |
| 数据处理 | 直接使用转换后的数组 | `groupArticlesByYearMonth()` 分组 |
| 客户端功能 | 列表/卡片视图切换 | 搜索功能 |
| 兜底策略 | ✅ 相同 | ✅ 相同 |
| "Demo Data" 标记 | ✅ 相同 | ✅ 相同 |
| ISR 配置 | ✅ 相同 | ✅ 相同 |

---

## 📚 相关文档

- `CATEGORY_API_MIGRATION.md` - 分类页面 API 改造文档
- `MOCK_DATA_FIX.md` - Mock 数据结构修复文档
- `DATA_LOADING_ANALYSIS.md` - 数据加载策略分析
- `lib/strapi.ts` - Strapi API 客户端
- `lib/mock-data.ts` - Mock 数据定义
- `lib/transformers.ts` - 数据转换器

---

## 🎯 构建结果

✅ **构建成功**

```bash
Route (app)                 Revalidate  Expire
┌ ○ /                               1m      1y
├ ○ /_not-found
├ ○ /about
├ ƒ /api/subscribe
├ ƒ /api/subscribe/confirm
├ ƒ /archive                 ← 已更新为动态渲染
├ ƒ /article/[slug]
├ ƒ /category/[slug]
└ ○ /subscribe

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

✓ Compiled successfully
```

---

生成时间: 2025-11-09
状态: ✅ 已完成
版本: v1.0.0
