/**
 * PageHeaderV2 — 归档页/分类页共用的页头（编辑风升级版，预览组件）
 * mono 计数标 + 衬线大标题 + 金色短 rule + 描述 + 暖光背景点缀
 */
export default function PageHeaderV2({
  count,
  countLabel,
  title,
  description,
}: {
  count: number;
  countLabel: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="relative mb-14 overflow-hidden px-4 py-10 text-center md:py-14">
      {/* 背景点缀：顶部暖光 + 对称淡走线 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(560px 200px at 50% -10%, rgba(217,119,6,.08), transparent 70%)',
          }}
        />
        <svg className="absolute left-0 top-6 w-[140px]" viewBox="0 0 140 40" fill="none">
          <path d="M0 14 H76 L90 28 H120" stroke="rgba(217,119,6,.22)" strokeWidth="1" />
          <circle cx="120" cy="28" r="2" fill="rgba(217,119,6,.35)" />
        </svg>
        <svg className="absolute right-0 top-6 w-[140px]" viewBox="0 0 140 40" fill="none">
          <path d="M140 14 H64 L50 28 H20" stroke="rgba(217,119,6,.22)" strokeWidth="1" />
          <circle cx="20" cy="28" r="2" fill="rgba(217,119,6,.35)" />
        </svg>
      </div>

      <p
        className="relative font-mono text-[11px] font-medium tracking-[0.26em] text-primary"
        style={{ textTransform: 'uppercase' }}
      >
        {count} {countLabel}
      </p>
      <h1 className="relative mt-4 font-serif text-4xl font-black tracking-tight lg:text-5xl">
        {title}
      </h1>
      <span
        className="relative mx-auto mt-6 block h-[2px] w-12 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }}
      />
      {description && (
        <p className="relative mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
          {description}
        </p>
      )}
    </header>
  );
}
