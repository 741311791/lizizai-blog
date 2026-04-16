import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-8xl font-bold text-primary/20 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">页面未找到</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        你访问的页面不存在或已被移动。试试从首页或归档页找到你想要的内容。
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          返回首页
        </Link>
        <Link
          href="/archive"
          className="px-6 py-2.5 rounded-md border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          浏览归档
        </Link>
      </div>
    </div>
  );
}
