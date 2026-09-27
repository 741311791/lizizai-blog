import { Link } from '@/i18n/navigation';
import { getArticlesByTag, getAllTagSlugs, getAllTags } from '@/lib/blog-data';
import ArticleGrid from '@/components/article/ArticleGrid';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllTagSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tags = await getAllTags();
  const tag = tags.find(t => t.slug === slug);
  return {
    title: `${tag?.name || slug} - Zizai Blog`,
    description: `浏览所有「${tag?.name || slug}」标签下的文章`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('tag');
  const [articles, allTags] = await Promise.all([
    getArticlesByTag(slug),
    getAllTags(),
  ]);
  const tag = allTags.find(t => t.slug === slug);

  // 未知标签硬 404，避免任意 /tag/xxx 返回 200 软 404
  if (!tag) notFound();

  const tagName = tag.name;

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-8">
      {/* 返回链接 */}
      <Link
        href="/archive"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToArchive')}
      </Link>

      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          #{tagName}
        </h1>
        <p className="text-muted-foreground">
          {t('articleCount', { count: articles.length })}
        </p>
      </div>

      {/* 文章列表 */}
      {articles.length > 0 ? (
        <ArticleGrid articles={articles} variant="default" />
      ) : (
        <p className="text-center text-muted-foreground py-12">
          {t('noArticles')}
        </p>
      )}

      {/* 相关标签 */}
      {allTags.length > 1 && (
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold mb-4">{t('otherTags')}</h2>
          <div className="flex flex-wrap gap-2">
            {allTags
              .filter(t => t.slug !== slug)
              .map(tag => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}`}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/20 transition-colors px-3.5 py-2 tabular-nums"
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamicParams = true;
