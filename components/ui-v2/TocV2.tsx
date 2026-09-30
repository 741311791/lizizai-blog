/**
 * TocV2 — 文章目录（编辑风升级：mono 标 + 金 rule + 当前项菱形指示，预览组件）
 */
export default function TocV2({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string; active?: boolean }[];
}) {
  return (
    <nav className="w-full max-w-[260px]">
      <p
        className="font-mono text-[10px] font-medium tracking-[0.26em] text-primary"
        style={{ textTransform: 'uppercase' }}
      >
        Contents
      </p>
      <p className="mt-1 text-sm font-bold">{title}</p>
      <span
        className="mt-3 block h-[2px] w-8 rounded-full"
        style={{ background: 'linear-gradient(90deg, var(--color-primary), transparent)' }}
        aria-hidden="true"
      />
      <ul className="mt-4 space-y-1">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-all ${
                it.active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:translate-x-0.5 hover:text-foreground'
              }`}
            >
              <span
                className={`h-[4px] w-[4px] rotate-45 flex-none transition-colors ${
                  it.active ? 'bg-primary' : 'bg-border'
                }`}
                style={it.active ? { boxShadow: '0 0 6px rgba(217,119,6,.7)' } : undefined}
                aria-hidden="true"
              />
              <span className={it.active ? 'font-medium' : undefined}>{it.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
