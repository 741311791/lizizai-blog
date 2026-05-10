import { getArticleBySlug, getRelatedArticles, getAllArticleSlugs } from '@/lib/blog-data';
import { getLikes, getViews } from '@/lib/services';
import { notFound } from 'next/navigation';
import { generateArticleMetadata, generateArticleJsonLd } from '@/lib/seo';
import ArticleDetailClient from '@/components/article/ArticleDetailClient';
import type { Metadata } from 'next';

export const revalidate = 3600; // ISR: 每小时重新验证

// 生成静态路径
export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map(slug => ({ slug }));
}

// 生成 SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: 'Article Not Found' };
  }

  return generateArticleMetadata({
    title: article.title,
    description: article.subtitle || article.excerpt,
    publishedAt: article.publishedAt,
    author: article.author.name,
    category: article.category?.name,
    tags: article.tags?.map((tag) => tag.name),
    imageUrl: article.featuredImage,
    slug: article.slug,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // 从 Cloudflare 服务获取动态数据
  const [likes, views] = await Promise.all([
    getLikes(article.id),
    getViews(article.id),
  ]);

  // 获取相关文章
  const relatedArticles = article.category?.slug
    ? await getRelatedArticles(article.category.slug, article.slug, 3)
    : [];

  // 生成 JSON-LD
  const articleJsonLd = generateArticleJsonLd({
    title: article.title,
    description: article.subtitle || article.excerpt,
    publishedAt: article.publishedAt,
    author: article.author.name,
    imageUrl: article.featuredImage,
    slug: article.slug,
  });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <ArticleDetailClient
        article={article}
        likes={likes || article.likes}
        views={views || article.views || 0}
        relatedArticles={relatedArticles}
      />
    </>
  );
}

// 允许动态参数（新增文章）
export const dynamicParams = true;
