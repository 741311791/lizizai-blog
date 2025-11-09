import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AuthorCard from '@/components/article/AuthorCard';
import ArticleActions from '@/components/article/ArticleActions';
import ArticleContent from '@/components/article/ArticleContent';

import RelatedArticles from '@/components/article/RelatedArticles';
import TableOfContents from '@/components/article/TableOfContents';
import { getArticleBySlug, getRelatedArticles, getArticles } from '@/lib/strapi';
import { transformArticle, transformArticles } from '@/lib/transformers';
import { notFound } from 'next/navigation';
import { generateArticleMetadata, generateArticleJsonLd } from '@/lib/seo';
import type { Metadata } from 'next';

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const strapiArticle = await getArticleBySlug(slug);

  if (!strapiArticle) {
    return {
      title: 'Article Not Found',
    };
  }

  const article = transformArticle(strapiArticle);

  return generateArticleMetadata({
    title: article.title,
    description: article.subtitle || article.excerpt,
    publishedAt: article.publishedAt,
    modifiedAt: strapiArticle.updatedAt,
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
  // Await params (Next.js 15+)
  const { slug } = await params;

  // Fetch article data
  const strapiArticle = await getArticleBySlug(slug);

  if (!strapiArticle) {
    notFound();
  }

  const article = transformArticle(strapiArticle);

  // Fetch related articles
  let relatedArticles: any[] = [];
  if (article.category?.slug) {
    const relatedResponse = await getRelatedArticles(
      article.category.slug,
      article.id,
      3
    );
    relatedArticles = transformArticles(relatedResponse.data as any);
  }

  // Generate JSON-LD for article
  const articleJsonLd = generateArticleJsonLd({
    title: article.title,
    description: article.subtitle || article.excerpt,
    publishedAt: article.publishedAt,
    modifiedAt: strapiArticle.updatedAt,
    author: article.author.name,
    imageUrl: article.featuredImage,
    slug: article.slug,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        {article.category && (
          <>
            <Link
              href={`/category/${article.category.slug}`}
              className="hover:text-foreground"
            >
              {article.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="truncate text-foreground">{article.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_250px]">
        {/* Main Content */}
        <article className="max-w-3xl">
          {/* Article Header */}
          <header className="mb-8 space-y-6">
            {article.category && (
              <Badge variant="secondary">{article.category.name}</Badge>
            )}
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-xl text-muted-foreground">{article.subtitle}</p>
            )}

            <AuthorCard
              author={article.author}
              publishedAt={article.publishedAt}
            />

            <ArticleActions
              articleId={article.id}
              likes={article.likes}
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
          {relatedArticles.length > 0 && (
            <RelatedArticles articles={relatedArticles} />
          )}
        </article>

        {/* Sidebar - Table of Contents */}
        <aside className="hidden lg:block">
          <TableOfContents content={article.content} />
        </aside>
      </div>
    </div>
    </>
  );
}

// Enable ISR (Incremental Static Regeneration) with 60s revalidation
export const revalidate = 60;

// Allow dynamic params for new articles
export const dynamicParams = true;
