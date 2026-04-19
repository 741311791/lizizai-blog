import { Badge } from '@/components/ui/badge';
import AuthorCard from '@/components/article/AuthorCard';
import ArticleActions from '@/components/article/ArticleActions';
import ArticleContent from '@/components/article/ArticleContent';
import RelatedArticles from '@/components/article/RelatedArticles';
import TableOfContents from '@/components/article/TableOfContents';
import MobileToc from '@/components/article/MobileToc';
import ReadingProgress from '@/components/article/ReadingProgress';
import ImageLightbox from '@/components/article/ImageLightbox';
import CommentSection from '@/components/article/CommentSection';
import { getArticleBySlug, getRelatedArticles, getAllArticleSlugs } from '@/lib/blog-data';
import { getLikes, getViews } from '@/lib/services';
import { notFound } from 'next/navigation';
import { generateArticleMetadata, generateArticleJsonLd } from '@/lib/seo';
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
      <ReadingProgress />
      <ImageLightbox />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_250px]">
          {/* Main Content */}
          <article className="max-w-3xl">
            {/* Article Header */}
            <header className="mb-8 space-y-4">
              {article.category && (
                <Badge variant="secondary">{article.category.name}</Badge>
              )}
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                {article.title}
              </h1>
              {article.subtitle && (
                <p className="text-lg text-muted-foreground leading-relaxed">{article.subtitle}</p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
                <AuthorCard
                  author={article.author}
                  publishedAt={article.publishedAt}
                />

                <ArticleActions
                  articleId={article.id}
                  likes={likes || article.likes}
                  shares={0}
                  views={views || article.views}
                />
              </div>
            </header>

            {/* Article Content */}
            <ArticleContent content={article.content} />

            {/* 移动端目录 */}
            <div className="mt-8">
              <MobileToc content={article.content} />
            </div>

            {/* 评论区 */}
            <CommentSection slug={article.slug} />

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

// 允许动态参数（新增文章）
export const dynamicParams = true;
