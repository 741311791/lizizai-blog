import { getArticleBySlug, getRelatedArticles, getAllArticleSlugs } from '@/lib/blog-data';
import { notFound } from 'next/navigation';
import { generateArticleMetadata, generateArticleJsonLd } from '@/lib/seo';
import ArticleDetailClient from '@/components/article/ArticleDetailClient';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import type { ArticleCardData } from '@/types/index';

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
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // 获取相关文章并投影为卡片最小字段集（不下发全文/幻灯片/播客数据）
  const relatedFull = article.category?.slug
    ? await getRelatedArticles(article.category.slug, article.slug, 3)
    : [];
  const relatedArticles: ArticleCardData[] = relatedFull.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.subtitle,
    excerpt: a.excerpt,
    slug: a.slug,
    featuredImage: a.featuredImage,
    thumbnailImage: a.thumbnailImage,
    author: a.author,
    publishedAt: a.publishedAt,
    likes: a.likes,
    commentsCount: a.commentsCount,
    readingTime: a.readingTime,
    sharesCount: a.sharesCount,
    tags: a.tags,
    contentType: a.contentType,
    slideCount: a.slideCount,
  }));

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
        likes={article.likes}
        views={article.views || 0}
        relatedArticles={relatedArticles}
      />
    </>
  );
}

// 允许动态参数（新增文章）
export const dynamicParams = true;
