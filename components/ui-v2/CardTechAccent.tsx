/**
 * CardTechAccent — 卡片科技感点缀层（hover 触发，支持变体）
 * circuit: 右上角 PCB 电路节点浮现 + 封面斜向极淡扫光（默认）
 * border: 边框流光（conic 金光沿边框旋转流动）
 * ripple: 电路节点 + 焊点涟漪扩散
 * 父容器需带 group 类；静态完全不可见，hover 才出现
 */

export type CardAccentVariant = 'circuit' | 'border' | 'ripple';

function CircuitNodes() {
  return (
    <svg
      className="cta-node absolute right-0 top-0 z-20 h-10 w-24"
      viewBox="0 0 96 40"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="rgba(255,183,94,.55)" strokeWidth="1">
        <path d="M96 10 H52 L38 24 H18" />
        <path d="M72 0 V8 L58 22" />
      </g>
      <g fill="rgba(255,183,94,.7)">
        <circle cx="18" cy="24" r="1.8" />
        <circle cx="58" cy="22" r="1.8" />
      </g>
      <circle
        cx="38"
        cy="24"
        r="2.6"
        stroke="rgba(255,183,94,.6)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export default function CardTechAccent({
  variant = 'circuit',
}: {
  variant?: CardAccentVariant;
}) {
  return (
    <>
      {/* 变体：边框流光 */}
      {variant === 'border' && <span className="cta-border" aria-hidden="true" />}

      {/* 变体：电路节点 + 焊点涟漪 */}
      {variant === 'ripple' && (
        <>
          <CircuitNodes />
          <span className="cta-ring" aria-hidden="true" />
        </>
      )}

      {/* 默认：电路节点 + 斜向扫光 */}
      {variant === 'circuit' && (
        <>
          <CircuitNodes />
          <span
            className="cta-sweep pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
            aria-hidden="true"
          />
        </>
      )}
    </>
  );
}
