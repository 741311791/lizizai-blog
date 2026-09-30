import ArchiveContent, { type ArchiveYearGroup, type ArchiveEntry } from '@/components/archive/ArchiveContent';
import { getAllArticles } from '@/lib/blog-data';
import { groupArticlesByYearMonth } from '@/lib/utils/archive';
import PageHeaderV2 from '@/components/ui-v2/PageHeaderV2';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const revalidate = 3600; // ISR: 每小时重新验证

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('archive');
  const articles = await getAllArticles();

  // 服务端投影为最小字段集，避免全文/章节等大对象下发 client
  const entries: ArchiveEntry[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    publishedAt: a.publishedAt,
    likes: a.likes,
    commentsCount: a.commentsCount,
    categoryName: a.category?.name,
  }));

  const grouped = groupArticlesByYearMonth(entries);
  const groups: ArchiveYearGroup[] = Object.entries(grouped).map(([year, months]) => ({
    year,
    months: Object.entries(months).map(([month, list]) => ({
      month: Number(month),
      articles: list,
    })),
  }));

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header V2 */}
      <PageHeaderV2
        count={articles.length}
        countLabel={t('articles')}
        title={t('title')}
        description={t('subtitle')}
      />

      {/* Archive Content with Search（数据已就绪，无需 Suspense） */}
      <ArchiveContent groups={groups} />
    </div>
  );
}
