/**
 * 文章卡片/列表骨架屏
 * 复用于分类页、标签页、每日资讯页的 loading.tsx
 */

/** 网格卡片骨架 — 与真实卡片 aspect-video 一致 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <div className="aspect-video bg-muted animate-pulse" />
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

/** 列表区块骨架 — 排序切换行 + 列表行(文字两行 + 右侧方图)，与真实默认 list 视图一致 */
export function ArticleListSectionSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {/* 排序切换 + 视图切换行 */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-11 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="hidden sm:block h-11 w-40 rounded-lg bg-muted animate-pulse" />
      </div>
      {/* 列表行 */}
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 sm:gap-6 py-4 sm:py-6 border-b border-border">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            </div>
            <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-lg bg-muted animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 分类页头部骨架(居中变体) */
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

/** 标签页头部骨架(左对齐变体 — 返回链接 + 左对齐标题) */
export function TagHeaderSkeleton() {
  return (
    <header className="mb-8">
      <div className="h-5 w-24 rounded bg-muted animate-pulse mb-6" />
      <div className="h-10 w-64 rounded-lg bg-muted animate-pulse mb-2" />
      <div className="h-5 w-32 rounded bg-muted animate-pulse" />
    </header>
  );
}
