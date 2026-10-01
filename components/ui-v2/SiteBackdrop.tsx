/**
 * SiteBackdrop — 全站低调动态背景层（支持变体）
 * dust: 微尘漂移 + 顶部暖光（默认）
 * grid: 极淡点阵网格
 * meteor: 低频流星
 * glow: 光晕呼吸
 * combo: dust + meteor 组合
 * 纯 CSS 动画零 JS、SSR 直出、prefers-reduced-motion 时静止
 */

export type BackdropVariant = 'dust' | 'grid' | 'meteor' | 'glow' | 'combo';

/** 确定性粒子分布（黄金比例散布避免聚类；透明度 0.08–0.2，全站常驻必须低调） */
const DUSTS = [
  { l: 6.2, t: 18.3, o: 0.10, dur: 112, delay: 0, dx: 30, dy: -80 },
  { l: 11.8, t: 64.5, o: 0.16, dur: 84, delay: -18, dx: -20, dy: -56 },
  { l: 17.4, t: 36.7, o: 0.09, dur: 126, delay: -42, dx: 26, dy: -92 },
  { l: 22.9, t: 82.1, o: 0.13, dur: 96, delay: -8, dx: -32, dy: -70 },
  { l: 28.5, t: 12.6, o: 0.18, dur: 78, delay: -55, dx: 18, dy: -48 },
  { l: 34.1, t: 55.4, o: 0.08, dur: 132, delay: -30, dx: 36, dy: -104 },
  { l: 39.7, t: 28.9, o: 0.12, dur: 102, delay: -66, dx: -24, dy: -64 },
  { l: 45.3, t: 74.2, o: 0.15, dur: 90, delay: -12, dx: 28, dy: -76 },
  { l: 50.9, t: 8.4, o: 0.10, dur: 118, delay: -48, dx: -30, dy: -88 },
  { l: 56.5, t: 47.6, o: 0.17, dur: 82, delay: -25, dx: 22, dy: -52 },
  { l: 62.1, t: 91.8, o: 0.09, dur: 124, delay: -70, dx: -26, dy: -96 },
  { l: 67.7, t: 22.3, o: 0.13, dur: 98, delay: -5, dx: 32, dy: -68 },
  { l: 73.3, t: 68.7, o: 0.11, dur: 108, delay: -38, dx: -18, dy: -60 },
  { l: 78.9, t: 41.2, o: 0.16, dur: 88, delay: -58, dx: 24, dy: -72 },
  { l: 84.5, t: 15.8, o: 0.10, dur: 122, delay: -20, dx: -34, dy: -84 },
  { l: 89.1, t: 77.4, o: 0.14, dur: 94, delay: -46, dx: 20, dy: -58 },
  { l: 93.7, t: 33.6, o: 0.08, dur: 128, delay: -14, dx: 28, dy: -100 },
  { l: 97.3, t: 59.1, o: 0.12, dur: 106, delay: -62, dx: -22, dy: -66 },
];

export default function SiteBackdrop({
  variant = 'dust',
}: {
  variant?: BackdropVariant;
}) {
  const showDust = variant === 'dust' || variant === 'combo';
  const showMeteor = variant === 'meteor' || variant === 'combo';

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      {/* 顶部极淡暖光（比页头/卡片点缀更淡一档） */}
      <div
        className="absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            'radial-gradient(720px 300px at 50% -60px, rgba(217,119,6,.028), transparent 70%)',
        }}
      />

      {/* 变体：极淡点阵网格 */}
      {variant === 'grid' && <div className="sd-grid absolute inset-0" />}

      {/* 变体：光晕呼吸（两处错开） */}
      {variant === 'glow' && (
        <>
          <div
            className="sd-glow absolute left-[8%] top-[18%] h-[420px] w-[420px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(217,119,6,.05), transparent 65%)',
              '--g-dur': '110s',
              '--g-delay': '0s',
            } as React.CSSProperties}
          />
          <div
            className="sd-glow absolute right-[10%] top-[55%] h-[360px] w-[360px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(217,119,6,.04), transparent 65%)',
              '--g-dur': '140s',
              '--g-delay': '-60s',
            } as React.CSSProperties}
          />
        </>
      )}

      {/* 变体：低频流星（两颗错开，26s/34s 周期各闪现约 2s） */}
      {showMeteor && (
        <>
          <span
            className="sd-meteor"
            style={{ '--m-dur': '26s', '--m-delay': '3s' } as React.CSSProperties}
          />
          <span
            className="sd-meteor"
            style={{ '--m-dur': '34s', '--m-delay': '17s' } as React.CSSProperties}
          />
        </>
      )}

      {/* 尘埃微动效 */}
      {showDust &&
        DUSTS.map((d, i) => (
          <span
            key={i}
            className="sd-dot absolute h-[2px] w-[2px] rounded-full"
            style={{
              left: `${d.l}%`,
              top: `${d.t}%`,
              background: 'rgba(255,183,94,.55)',
              '--sd-o': d.o,
              '--sd-dur': `${d.dur}s`,
              '--sd-delay': `${d.delay}s`,
              '--sd-x': `${d.dx}px`,
              '--sd-y': `${d.dy}px`,
            } as React.CSSProperties}
          />
        ))}
    </div>
  );
}
