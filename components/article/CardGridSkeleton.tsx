/**
 * 文章卡片网格骨架屏
 * 复用于分类页、标签页、每日资讯页的 loading.tsx
 */

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <div className="aspect-[16/10] bg-muted animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 分类页头部骨架
 */
export function CategoryHeaderSkeleton() {
  return (
    <header className="mb-12 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="h-12 w-48 mx-auto rounded-lg bg-muted animate-pulse" />
      <div className="h-5 w-96 mx-auto rounded bg-muted animate-pulse" />
    </header>
  );
}
