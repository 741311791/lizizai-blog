/**
 * PageHeaderV2 — 归档页/分类页/Daily News 共用的页头（编辑风升级版，预览组件）
 * mono 计数标 + 衬线大标题 + 金色短 rule + 描述 + 暖光背景点缀
 * variant 控制两侧走线形态
 */

type HeaderVariant = 'circuit' | 'pulse' | 'rails';

/** 左側走线；右侧通过 scale-x 镜像复用 */
const VARIANT_LINES: Record<
  HeaderVariant,
  { paths: string[]; dots: { cx: number; cy: number }[] }
> = {
  // 归档：电路走线 + 末端节点
  circuit: {
    paths: ['M0 14 H76 L90 28 H120'],
    dots: [{ cx: 120, cy: 28 }],
  },
  // Daily News：新闻脉搏线（尖峰跳动）
  pulse: {
    paths: ['M0 20 H34 L44 8 L56 32 L66 20 H120'],
    dots: [{ cx: 120, cy: 20 }],
  },
  // 分类：双轨线（主线折角 + 副线短轨）
  rails: {
    paths: ['M0 12 H64 L78 26 H120', 'M0 34 H44'],
    dots: [
      { cx: 120, cy: 26 },
      { cx: 44, cy: 34 },
    ],
  },
};

function HeaderLines({ variant, mirror }: { variant: HeaderVariant; mirror?: boolean }) {
  const { paths, dots } = VARIANT_LINES[variant];
  return (
    <svg
      className={`absolute top-6 w-[140px] ${mirror ? 'right-0 -scale-x-100' : 'left-0'}`}
      viewBox="0 0 140 40"
      fill="none"
    >
      {paths.map((d) => (
        <path key={d} d={d} stroke="rgba(217,119,6,.22)" strokeWidth="1" />
      ))}
      {dots.map((dot) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r="2"
          fill="rgba(217,119,6,.35)"
        />
      ))}
    </svg>
  );
}

export default function PageHeaderV2({
  count,
  countLabel,
  title,
  description,
  variant = 'circuit',
}: {
  count: number;
  countLabel: string;
  title: string;
  description?: string;
  variant?: HeaderVariant;
}) {
  return (
    <header className="relative mb-14 overflow-hidden px-4 py-10 text-center md:py-14">
      {/* 背景点缀：顶部暖光 + 对称走线（按 variant 变化） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(560px 200px at 50% -10%, rgba(217,119,6,.08), transparent 70%)',
          }}
        />
        <HeaderLines variant={variant} />
        <HeaderLines variant={variant} mirror />
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
