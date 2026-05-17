/**
 * 文章详情页骨架屏
 */

export default function ArticleLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
        {/* 左栏：文章头部 + 内容骨架 */}
        <article className="max-w-3xl">
          <header className="mb-8 space-y-4">
            {/* 内容类型徽章 */}
            <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
            {/* 标题 */}
            <div className="h-10 w-3/4 rounded-lg bg-muted animate-pulse" />
            {/* 副标题 */}
            <div className="h-5 w-1/2 rounded bg-muted animate-pulse" />
            {/* 作者信息 */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          </header>
          {/* 正文骨架 */}
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div
                  className="h-4 rounded bg-muted animate-pulse"
                  style={{ width: `${75 + Math.random() * 25}%` }}
                />
                {i % 3 === 0 && (
                  <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </article>
        {/* 右栏：侧边栏骨架 */}
        <aside className="hidden lg:block sticky top-6 self-start border-l border-border pl-6">
          <div className="space-y-7">
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
          </div>
        </aside>
      </div>
    </div>
  );
}
