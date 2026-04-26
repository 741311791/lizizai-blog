/**
 * AI 资讯归档页 — 客户端交互部分
 *
 * 处理日期选择和标签筛选的 URL 参数更新，
 * 以及"加载更多"的分页逻辑。
 */

'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useState } from 'react';
import AiNewsDateSelector from '@/components/ai-news/AiNewsDateSelector';
import DailyNewsFeatured from '@/components/ai-news/DailyNewsFeatured';
import DailyNewsCard from '@/components/ai-news/DailyNewsCard';
import { Button } from '@/components/ui/button';
import type { AiNews } from '@/types/index';

interface AiNewsArchiveClientProps {
  dates: string[];
  initialDate: string | null;
  tag: string | null;
  locale: string;
  featured: AiNews[];
  regular: AiNews[];
  isEmpty: boolean;
  translations: {
    noData: string;
    loadMore: string;
  };
}

export default function AiNewsArchiveClient({
  dates,
  initialDate,
  tag,
  locale,
  featured,
  regular,
  isEmpty,
  translations,
}: AiNewsArchiveClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [displayCount, setDisplayCount] = useState(12);

  // 日期选择 → 更新 URL 参数
  const handleDateChange = (date: string) => {
    const params = new URLSearchParams();
    params.set('date', date);
    if (tag) params.set('tag', tag);
    router.push(`${pathname}?${params.toString()}`);
  };

  // 加载更多
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 12);
  };

  const visibleRegular = regular.slice(0, displayCount);
  const hasMore = regular.length > displayCount;

  if (isEmpty) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>{translations.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 日期选择器 */}
      <AiNewsDateSelector
        dates={dates}
        selectedDate={initialDate}
        onDateChange={handleDateChange}
        locale={locale}
      />

      {/* 头条 */}
      {featured.length > 0 && (
        <div className="space-y-4">
          {featured.map((item) => (
            <DailyNewsFeatured key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}

      {/* 普通资讯网格 */}
      {visibleRegular.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRegular.map((item) => (
            <DailyNewsCard key={item.id} item={item} showDate locale={locale} />
          ))}
        </div>
      )}

      {/* 加载更多 */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="px-8"
          >
            {translations.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
