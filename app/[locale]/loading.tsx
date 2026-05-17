/**
 * 首页骨架屏
 */

export default function HomeLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Hero 精选骨架 */}
      <section className="py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-3">
            <div className="aspect-[16/10] rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-5">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-10 w-3/4 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-full rounded bg-muted animate-pulse" />
            <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-12 w-48 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </section>
      {/* 文章列表骨架 */}
      <div className="py-12 space-y-6">
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-6 py-6 border-b border-border">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
            </div>
            <div className="hidden sm:block w-40 h-28 rounded-lg bg-muted animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
