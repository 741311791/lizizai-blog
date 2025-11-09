import { Suspense } from 'react';
import ArchiveContent from '@/components/archive/ArchiveContent';
import { getArticles } from '@/lib/strapi';
import { transformArticles } from '@/lib/transformers';
import { mockArchive, groupArticlesByYearMonth } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';

export default async function ArchivePage() {
  let archiveData: Record<string, Record<string, any[]>> = {};
  let isUsingMockData = false;
  let totalArticles = 0;

  try {
    // 优先尝试从 Strapi API 获取所有文章
    console.log('🔍 Fetching all articles from Strapi API for archive...');

    const response = await getArticles({
      pageSize: 100, // 获取大量文章用于归档
      sort: 'publishedAt:desc',
    });

    const articles = transformArticles(response.data as any);

    if (articles && articles.length > 0) {
      // 将文章按年月分组
      archiveData = groupArticlesByYearMonth(articles);
      totalArticles = articles.length;

      console.log(`✅ Successfully loaded ${totalArticles} articles from API`);
    } else {
      throw new Error('No articles found in API');
    }
  } catch (error) {
    // API 调用失败，降级到 Mock 数据
    console.warn(
      '⚠️ Failed to fetch articles from API, falling back to mock data:',
      error
    );

    isUsingMockData = true;
    archiveData = mockArchive;

    // 计算 Mock 数据的文章总数
    totalArticles = Object.values(mockArchive).reduce(
      (yearTotal, months) =>
        yearTotal +
        Object.values(months).reduce(
          (monthTotal, articles) => monthTotal + articles.length,
          0
        ),
      0
    );

    console.log(`📦 Using mock data: ${totalArticles} articles`);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <header className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="secondary">{totalArticles} Articles</Badge>
          {isUsingMockData && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Demo Data
            </Badge>
          )}
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

// 启用动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 60; // 每 60 秒重新验证
