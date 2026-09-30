import Image from 'next/image';

/**
 * AboutHeroV2 — 关于页 hero（编辑风 + 简历页光环语言，预览组件）
 * 头像双层光环 + mono 品牌标 + 衬线大字 + tagline
 */
export default function AboutHeroV2({
  avatar,
  name,
  tagline,
}: {
  avatar: string;
  name: string;
  tagline: string;
}) {
  return (
    <header className="relative mb-14 px-4 py-12 text-center md:py-16">
      {/* 暖光氛围 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(480px 240px at 50% 20%, rgba(217,119,6,.08), transparent 70%)' }}
        aria-hidden="true"
      />
      {/* 头像 + 双层光环 */}
      <div className="relative mx-auto h-36 w-36">
        <div
          className="absolute -inset-4 rounded-full"
          style={{ border: '1px solid rgba(217,119,6,.35)', boxShadow: '0 0 24px rgba(217,119,6,.15)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -inset-8 rounded-full"
          style={{ border: '1px solid rgba(217,119,6,.16)' }}
          aria-hidden="true"
        />
        <div className="h-full w-full overflow-hidden rounded-full ring-1 ring-white/10">
          <Image src={avatar} alt={name} width={144} height={144} sizes="144px" className="h-full w-full object-cover" />
        </div>
      </div>
      <p
        className="mt-8 font-mono text-[11px] font-medium tracking-[0.26em] text-primary"
        style={{ textTransform: 'uppercase' }}
      >
        About
      </p>
      <h1 className="mt-3 font-serif text-4xl font-black tracking-tight lg:text-5xl">{name}</h1>
      <p className="mx-auto mt-5 max-w-2xl text-xl text-muted-foreground text-pretty">{tagline}</p>
    </header>
  );
}
