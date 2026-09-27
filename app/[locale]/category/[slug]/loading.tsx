/**
 * 分类页骨架屏 — 默认 list 视图形态
 */

import { CategoryHeaderSkeleton, ArticleListSectionSkeleton } from '@/components/article/CardGridSkeleton';

export default function CategoryLoading() {
  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-12">
      <CategoryHeaderSkeleton />
      <ArticleListSectionSkeleton />
    </div>
  );
}
