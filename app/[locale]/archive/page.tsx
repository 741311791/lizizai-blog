import { Suspense } from 'react';
import ArchiveContent from '@/components/archive/ArchiveContent';
import { getAllArticles } from '@/lib/blog-data';
import { groupArticlesByYearMonth } from '@/lib/utils/archive';
import { Badge } from '@/components/ui/badge';

export const revalidate = 3600; // ISR: 每小时重新验证

export default async function ArchivePage() {
  const articles = await getAllArticles();
  const archiveData = groupArticlesByYearMonth(articles);
  const totalArticles = articles.length;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <header className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="secondary">{totalArticles} Articles</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Archive
        </h1>
        <p className="text-xl text-muted-foreground">
          Browse all articles by date
        </p>
      </header>

      {/* Archive Content with Search */}
      <Suspense fallback={<ArchiveContentSkeleton />}>
        <ArchiveContent archiveData={archiveData} />
      </Suspense>
    </div>
  );
}

// 骨架屏组件
function ArchiveContentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-12 bg-muted rounded-lg animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
