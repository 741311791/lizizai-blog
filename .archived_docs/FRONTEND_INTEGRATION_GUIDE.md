# 前端集成 Strapi API 指南

本指南说明如何将前端与 Strapi 后端集成。

---

## 已创建的文件

### 1. API 客户端库
**文件**: `frontend/lib/strapi.ts`

提供了完整的 Strapi API 调用函数：
- `getArticles()` - 获取文章列表
- `getArticleBySlug()` - 获取单篇文章
- `getPopularArticles()` - 获取热门文章
- `getLatestArticles()` - 获取最新文章
- `getRelatedArticles()` - 获取相关文章
- `getCategories()` - 获取分类列表
- `getCategoryBySlug()` - 获取单个分类
- `getArticlesByCategory()` - 获取分类下的文章
- `getAuthors()` - 获取作者列表
- `getTags()` - 获取标签列表
- `getCommentsByArticle()` - 获取文章评论
- `createComment()` - 创建评论
- `searchArticles()` - 搜索文章

### 2. TypeScript 类型定义
**文件**: `frontend/types/strapi.ts`

定义了所有 Strapi 数据类型：
- `StrapiArticle`
- `StrapiCategory`
- `StrapiAuthor`
- `StrapiComment`
- `StrapiTag`
- `Article` (前端简化版)
- `Category` (前端简化版)
- 等等...

### 3. 数据转换工具
**文件**: `frontend/lib/transformers.ts`

提供数据转换和格式化函数：
- `transformArticle()` - 转换文章数据
- `transformComment()` - 转换评论数据
- `formatDate()` - 格式化日期
- `formatRelativeTime()` - 格式化相对时间
- `generateExcerpt()` - 生成摘要
- `calculateReadingTime()` - 计算阅读时长

### 4. 环境变量配置
**文件**: `frontend/.env.local`

配置了 Strapi API 地址和站点信息。

---

## 更新现有页面

### 1. 更新首页 (`app/page.tsx`)

将 mock 数据替换为真实 API 调用：

```typescript
import { getPopularArticles, getLatestArticles } from '@/lib/strapi';
import { transformArticles } from '@/lib/transformers';

export default async function HomePage() {
  // 获取热门文章
  const popularResponse = await getPopularArticles(4);
  const popularArticles = transformArticles(popularResponse.data);

  // 获取最新文章
  const latestResponse = await getLatestArticles(9);
  const latestArticles = transformArticles(latestResponse.data);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Most Popular */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Most Popular</h2>
          <Link href="/archive">
            <Button variant="outline">VIEW ALL</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Latest Articles with Tabs */}
      <Tabs defaultValue="latest" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>
        <TabsContent value="latest">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </TabsContent>
        {/* 其他 tabs... */}
      </Tabs>
    </div>
  );
}

// 启用 ISR
export const revalidate = 60; // 每60秒重新验证
```

### 2. 更新文章详情页 (`app/article/[slug]/page.tsx`)

```typescript
import { getArticleBySlug, getRelatedArticles } from '@/lib/strapi';
import { transformArticle, transformArticles } from '@/lib/transformers';
import { notFound } from 'next/navigation';

export default async function ArticlePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // 获取文章数据
  const strapiArticle = await getArticleBySlug(params.slug);
  
  if (!strapiArticle) {
    notFound();
  }

  const article = transformArticle(strapiArticle);

  // 获取相关文章
  const relatedResponse = await getRelatedArticles(
    article.category.slug,
    article.id,
    3
  );
  const relatedArticles = transformArticles(relatedResponse.data);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/category/${article.category.slug}`}>
          {article.category.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate">{article.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
        <article className="max-w-3xl">
          {/* Article Header */}
          <header className="mb-8 space-y-6">
            <Badge variant="secondary">{article.category.name}</Badge>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-xl text-muted-foreground">
                {article.subtitle}
              </p>
            )}
            
            <AuthorCard 
              author={article.author} 
              publishedAt={article.publishedAt} 
            />

            <ArticleActions
              likes={article.likes}
              commentsCount={article.commentsCount || 0}
              shares={0}
            />
          </header>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
              <Image
                src={article.featuredImage}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <ArticleContent content={article.content} />

          {/* Related Articles */}
          <RelatedArticles articles={relatedArticles} />
        </article>

        {/* Sidebar - Table of Contents */}
        <aside className="hidden lg:block">
          <TableOfContents content={article.content} />
        </aside>
      </div>
    </div>
  );
}

// 生成静态路径
export async function generateStaticParams() {
  const { data: articles } = await getArticles({ pageSize: 100 });
  
  return articles.map((article: any) => ({
    slug: article.slug,
  }));
}

// 启用 ISR
export const revalidate = 3600; // 每小时重新验证
```

### 3. 更新分类页面 (`app/category/[slug]/page.tsx`)

```typescript
import { getCategoryBySlug, getArticlesByCategory } from '@/lib/strapi';
import { transformArticles } from '@/lib/transformers';
import { notFound } from 'next/navigation';

export default async function CategoryPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // 获取分类信息
  const category = await getCategoryBySlug(params.slug);
  
  if (!category) {
    notFound();
  }

  // 获取分类下的文章
  const articlesResponse = await getArticlesByCategory(params.slug, 1, 12);
  const articles = transformArticles(articlesResponse.data);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-xl text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

// 生成静态路径
export async function generateStaticParams() {
  const categories = await getCategories();
  
  return categories.map((category: any) => ({
    slug: category.slug,
  }));
}

export const revalidate = 3600;
```

---

## 在 Vercel 中配置环境变量

1. 访问 Vercel 项目设置
2. 进入 "Environment Variables" 标签
3. 添加以下环境变量：

```
NEXT_PUBLIC_STRAPI_URL=https://lizizai-blog.onrender.com
NEXT_PUBLIC_STRAPI_API_URL=https://lizizai-blog.onrender.com/api
NEXT_PUBLIC_STRAPI_GRAPHQL_URL=https://lizizai-blog.onrender.com/graphql
NEXT_PUBLIC_SITE_URL=https://frontend-kdicg9ptg-louies-projects-dbfd71aa.vercel.app
NEXT_PUBLIC_SITE_NAME=Letters Clone
NEXT_PUBLIC_SITE_DESCRIPTION=A modern blog platform powered by Next.js and Strapi
NEXT_PUBLIC_ENABLE_COMMENTS=true
NEXT_PUBLIC_ENABLE_SEARCH=true
```

4. 重新部署前端

---

## 测试 API 集成

### 本地测试

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000 查看效果

### 测试 API 调用

创建测试脚本 `frontend/scripts/test-api.ts`:

```typescript
import { getArticles, getCategories } from '../lib/strapi';

async function testAPI() {
  try {
    console.log('Testing Strapi API...\n');

    // 测试获取文章
    console.log('Fetching articles...');
    const articlesResponse = await getArticles({ pageSize: 5 });
    console.log(`✓ Found ${articlesResponse.data.length} articles`);
    console.log(`  Total: ${articlesResponse.meta.pagination?.total}`);

    // 测试获取分类
    console.log('\nFetching categories...');
    const categories = await getCategories();
    console.log(`✓ Found ${categories.length} categories`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPI();
```

运行测试：
```bash
npx tsx scripts/test-api.ts
```

---

## 常见问题

### 1. CORS 错误

如果遇到 CORS 错误，确保 Strapi 的 `config/middlewares.ts` 中已配置前端域名。

### 2. 图片无法加载

在 `next.config.js` 中添加 Strapi 域名到图片配置：

```javascript
module.exports = {
  images: {
    domains: ['lizizai-blog.onrender.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lizizai-blog.onrender.com',
      },
    ],
  },
};
```

### 3. API 响应慢

Render Free Plan 会在不活动后休眠，首次请求可能需要 30-60 秒唤醒。

解决方案：
- 升级到付费计划
- 使用定时任务保持服务活跃
- 实现加载状态和骨架屏

### 4. 数据未更新

检查 ISR 配置：
- 确保设置了 `revalidate` 时间
- 手动触发重新验证
- 清除 Vercel 缓存

---

## 下一步

1. 在 Strapi 中创建内容类型
2. 添加示例数据
3. 更新前端页面使用真实 API
4. 配置 Vercel 环境变量
5. 部署并测试
6. 实现评论功能
7. 实现搜索功能
8. 添加分页功能

---

## 参考资源

- [Strapi Documentation](https://docs.strapi.io/)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
