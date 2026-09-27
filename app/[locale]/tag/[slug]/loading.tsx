/**
 * 标签页骨架屏 — 左对齐头部 + 网格卡片(真实页为 ArticleGrid 网格)
 */

import { TagHeaderSkeleton, CardGridSkeleton } from '@/components/article/CardGridSkeleton';

export default function TagLoading() {
  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-8">
      <TagHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}
