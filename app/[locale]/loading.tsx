/**
 * 首页骨架屏 — 与真实布局逐区块对齐，避免加载完成跳变
 * (Hero / DailyNews 横条 / ArticlesSection Tabs+列表行)
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

      {/* 每日资讯骨架 — 标题行 + 横滑卡片条 */}
      <section className="py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="h-7 w-40 rounded bg-muted animate-pulse" />
          <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 md:w-80 h-[196px] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </section>

      {/* 文章区块骨架 — Tabs 头 + 视图切换位 + 列表行(右侧缩略图 96/160px 对齐) */}
      <div className="py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="h-9 w-52 rounded-lg bg-muted animate-pulse" />
          <div className="hidden sm:block h-11 w-[88px] rounded-lg bg-muted animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 sm:gap-6 py-4 sm:py-6 border-b border-border">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-1/3 rounded bg-muted animate-pulse" />
            </div>
            <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-lg bg-muted animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
