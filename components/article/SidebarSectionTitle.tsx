interface SidebarSectionTitleProps {
  /** 英文 mono 眉题（小字、primary 色） */
  eyebrow: string;
  /** 本地化主标题 */
  title: string;
}

/**
 * 文章侧边栏模块标题：英文眉题 + 本地化主标题 + 渐变短线
 * 与 Reader Guide / 目录 模块保持同一视觉语言
 */
export default function SidebarSectionTitle({ eyebrow, title }: SidebarSectionTitleProps) {
  return (
    <div>
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-primary">
        {eyebrow}
      </div>
      <div className="mt-1 text-sm font-bold">{title}</div>
      <span
        className="mt-2.5 mb-3 block h-[2px] w-8 rounded-full"
        style={{ background: 'linear-gradient(90deg, var(--color-primary), transparent)' }}
        aria-hidden="true"
      />
    </div>
  );
}
