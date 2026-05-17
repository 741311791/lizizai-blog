/**
 * 每日资讯页骨架屏
 */

import { CategoryHeaderSkeleton, CardGridSkeleton } from '@/components/article/CardGridSkeleton';

export default function DailyNewsLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <CategoryHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}
