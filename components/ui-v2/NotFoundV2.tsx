import { Link } from '@/i18n/navigation';

/**
 * NotFoundV2 — 404 页（PCB 断线主题，预览组件）
 * 走线到中央断开（信号丢失隐喻）+ 断口焊盘 + 编辑风按钮
 */
export default function NotFoundV2({
  title,
  description,
  backHome,
  browseArchive,
}: {
  title: string;
  description: string;
  backHome: string;
  browseArchive: string;
}) {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      {/* 暖光 + 断线走线 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(480px 220px at 50% 40%, rgba(217,119,6,.07), transparent 70%)' }}
        />
        <svg className="absolute left-0 top-1/2 w-full -translate-y-1/2" viewBox="0 0 1200 120" fill="none" preserveAspectRatio="xMidYMid meet">
          {/* 左侧走线，行至中央断开 */}
          <path d="M0 60 H360 L392 28 H500" stroke="rgba(217,119,6,.3)" strokeWidth="1.5" />
          <circle cx="500" cy="28" r="4" fill="rgba(217,119,6,.6)" />
          {/* 断口另一侧 */}
          <path d="M700 92 H808 L840 60 H1200" stroke="rgba(217,119,6,.3)" strokeWidth="1.5" />
          <circle cx="700" cy="92" r="4" fill="rgba(217,119,6,.6)" />
          {/* 断口电火花点缀 */}
          <path d="M560 44 L576 60 L560 76" stroke="rgba(217,119,6,.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M640 44 L624 60 L640 76" stroke="rgba(217,119,6,.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p
        className="relative font-mono text-[11px] font-medium tracking-[0.3em] text-primary"
        style={{ textTransform: 'uppercase' }}
      >
        Signal Lost
      </p>
      <h1 className="relative mt-4 font-serif text-8xl font-black leading-none tracking-tight">
        404
      </h1>
      <h2 className="relative mt-6 text-2xl font-bold">{title}</h2>
      <p className="relative mt-3 mb-9 max-w-md text-muted-foreground text-pretty">{description}</p>
      <div className="relative flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-full px-7 py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(90deg,#d97706,#f59e0b)', boxShadow: '0 0 18px rgba(217,119,6,.35)' }}
        >
          {backHome}
        </Link>
        <Link
          href="/archive"
          className="rounded-full border border-border px-7 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
        >
          {browseArchive}
        </Link>
      </div>
    </div>
  );
}
