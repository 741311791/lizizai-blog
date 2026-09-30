/**
 * ReadingProgressV2 — 阅读进度条（琥珀渐变 + 末端光点，静态演示版）
 * 实装时由 client 组件按滚动进度驱动 width
 */
export default function ReadingProgressV2({ progress = 62 }: { progress?: number }) {
  return (
    <div className="relative h-[3px] w-full overflow-visible rounded-full bg-border/60">
      <div
        className="relative h-full rounded-full transition-[width] duration-150"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #b45309, #d97706, #f59e0b)',
          boxShadow: '0 0 8px rgba(217,119,6,.55)',
        }}
      >
        <span
          className="absolute -right-1 -top-[2.5px] h-2 w-2 rounded-full"
          style={{
            background: '#fbbf24',
            boxShadow: '0 0 8px rgba(251,191,36,.9)',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
