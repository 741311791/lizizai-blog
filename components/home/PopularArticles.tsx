import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getArticleImageUrl } from '@/lib/utils/image';
import type { Article } from '@/types/index';

interface PopularArticlesProps {
  articles: Article[];
}

export default async function PopularArticles({ articles }: PopularArticlesProps) {
  const t = await getTranslations('home');
  const tArticle = await getTranslations('article');
  const popularArticles = articles.slice(0, 4);

  if (popularArticles.length === 0) return null;

  return (
    <section className="relative py-12">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">{t('mostPopular')}</h2>
          <Link href="/archive">
            <Button variant="link" className="text-primary hover:text-primary/80">
              {t('viewAll')}
            </Button>
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularArticles.map((article) => {
            const date = article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
              : '';
            const isPremium = article.tags?.some(t => t.name === '课程');
            const imageUrl = getArticleImageUrl(article.featuredImage, article.id);

            return (
              <Link key={article.slug} href={`/article/${article.slug}`}>
                <div className="group flex gap-4 hover:opacity-80 transition-opacity">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      unoptimized={imageUrl.includes('picsum.photos')}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-tight mb-1.5 line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {isPremium && <Lock className="h-3 w-3" />}
                      <span className="uppercase">{date}</span>
                      <span>·</span>
                      <span className="uppercase">{article.author?.name || '李自在'}</span>
                      {article.readingTime && (
                        <>
                          <span>·</span>
                          <span>{tArticle('readingTime', { count: article.readingTime })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
