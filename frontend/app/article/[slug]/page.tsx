import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AuthorCard from '@/components/article/AuthorCard';
import ArticleActions from '@/components/article/ArticleActions';
import ArticleContent from '@/components/article/ArticleContent';
import CommentSection from '@/components/article/CommentSection';
import RelatedArticles from '@/components/article/RelatedArticles';
import TableOfContents from '@/components/article/TableOfContents';
import { getArticleBySlug, getRelatedArticles, getArticles } from '@/lib/strapi';
import { transformArticle, transformArticles } from '@/lib/transformers';
import { notFound } from 'next/navigation';

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  // Fetch article data
  const strapiArticle = await getArticleBySlug(params.slug);

  if (!strapiArticle) {
    notFound();
  }

  const article = transformArticle(strapiArticle);

  // Fetch related articles
  let relatedArticles = [];
  if (article.category?.slug) {
    const relatedResponse = await getRelatedArticles(
      article.category.slug,
      article.id,
      3
    );
    relatedArticles = transformArticles(relatedResponse.data);
  }

  // Mock comments (will be replaced with real API later)
  const mockComments = [
    {
      id: '1',
      author: {
        name: 'John Smith',
        avatar: 'https://picsum.photos/seed/user1/100/100',
      },
      content:
        'This is such an insightful article! The point about taste being the new intelligence really resonated with me.',
      createdAt: '2025-07-22',
      likes: 42,
      replies: [
        {
          id: '2',
          author: {
            name: 'Sarah Johnson',
            avatar: 'https://picsum.photos/seed/user2/100/100',
          },
          content:
            'Totally agree! The distinction between doers and directors is becoming more clear every day.',
          createdAt: '2025-07-23',
          likes: 15,
        },
      ],
    },
  ];

  return (
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

          {/* Comment Section */}
          <CommentSection comments={mockComments} />

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
  );
}

// Generate static params for all articles
export async function generateStaticParams() {
  const { data: articles } = await getArticles({ pageSize: 100 });

  return articles.map((article: any) => ({
    slug: article.slug,
  }));
}

// Enable ISR
export const revalidate = 3600; // Revalidate every hour
