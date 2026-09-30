/**
 * LoadingIndicatorV2 — 品牌化加载指示（菱形三点错峰脉动，预览组件）
 * 用于路由切换/内容加载态，替代默认 spinner
 */
export default function LoadingIndicatorV2({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10" role="status" aria-label="loading">
      <div className="flex items-center gap-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-2 w-2 rotate-45"
            style={{
              background: 'var(--color-primary)',
              boxShadow: '0 0 8px rgba(217,119,6,.6)',
              animation: `uv-diamond 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
      {label && (
        <p className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground" style={{ textTransform: 'uppercase' }}>
          {label}
        </p>
      )}
    </div>
  );
}
