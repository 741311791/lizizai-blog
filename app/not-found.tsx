/**
 * 根级 404：匹配不到 [locale] 下任何路由时渲染。
 * root layout 为透传架构（html/body 在 [locale]/layout），此处需自带文档结构；
 * 且位于 i18n Provider 之外，文案随站点默认语言（zh）、链接用原生 <a>。
 */
export default function RootNotFound() {
  return (
    <html lang="zh" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center antialiased">
        <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden text-center">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(480px 220px at 50% 40%, rgba(217,119,6,.07), transparent 70%)' }}
            />
            <svg className="absolute left-0 top-1/2 w-full -translate-y-1/2" viewBox="0 0 1200 120" fill="none" preserveAspectRatio="xMidYMid meet">
              <path d="M0 60 H360 L392 28 H500" stroke="rgba(217,119,6,.3)" strokeWidth="1.5" />
              <circle cx="500" cy="28" r="4" fill="rgba(217,119,6,.6)" />
              <path d="M700 92 H808 L840 60 H1200" stroke="rgba(217,119,6,.3)" strokeWidth="1.5" />
              <circle cx="700" cy="92" r="4" fill="rgba(217,119,6,.6)" />
              <path d="M560 44 L576 60 L560 76" stroke="rgba(217,119,6,.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M640 44 L624 60 L640 76" stroke="rgba(217,119,6,.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="relative font-mono text-[11px] font-medium tracking-[0.3em] text-primary uppercase">
            Signal Lost
          </p>
          <h1 className="relative mt-4 font-serif text-8xl font-black leading-none tracking-tight">404</h1>
          <h2 className="relative mt-6 text-2xl font-bold">页面未找到</h2>
          <p className="relative mt-3 mb-9 max-w-md text-muted-foreground">
            你访问的页面不存在或已被移动。试试从首页或归档页找到你想要的内容。
          </p>
          <div className="relative flex flex-wrap items-center justify-center gap-4">
            <a
              href="/"
              className="rounded-full px-7 py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(90deg,#d97706,#f59e0b)', boxShadow: '0 0 18px rgba(217,119,6,.35)' }}
            >
              返回首页
            </a>
            <a
              href="/archive"
              className="rounded-full border border-border px-7 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              浏览归档
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
