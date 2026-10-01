
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import SocialLinks from '@/components/ui/social-links';
import SubstackEmbed from '@/components/subscribe/SubstackEmbed';

/**
 * Footer v2 — 编辑风双层结构 + 背景点缀（暖光/走线/粒子）
 * 上层：品牌陈述区（衬线字标 + 宣言 + 订阅组件，不对称两栏）
 * 下层：细线分隔的紧凑工具条（社交 / 分层链接 / 版权 / mono 收尾行）
 */
export default function FooterV2() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  const exploreLinks = [
    { href: '/category/ai', label: nav('ai') },
    { href: '/category/human-3-0', label: nav('cognition') },
    { href: '/category/premium-course', label: nav('premiumCourse') },
    { href: '/category/portfolio', label: nav('portfolio') },
    { href: '/archive', label: nav('archive') },
    { href: '/resume', label: nav('resume') },
  ] as const;

  return (
    <footer
      className="relative overflow-hidden border-t bg-card"
      style={{ borderColor: 'rgba(217, 119, 6, 0.18)' }}
    >
      {/* 背景点缀层：暖光氛围 + PCB 走线 + 尘埃粒子（简历页语言的轻量版） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(600px 220px at 85% 0%, rgba(217,119,6,.07), transparent 70%), radial-gradient(420px 180px at 6% 100%, rgba(217,119,6,.05), transparent 70%)',
          }}
        />
        {/* 右上角 PCB 走线 */}
        <svg className="absolute right-0 top-0 w-[280px]" viewBox="0 0 280 96" fill="none">
          <g stroke="rgba(217,119,6,.26)" strokeWidth="1">
            <path d="M280 20 H188 L166 42 H100" />
            <path d="M280 46 H208 L186 68 H148" />
            <path d="M244 0 V16 L222 38" />
          </g>
          <g fill="rgba(217,119,6,.4)">
            <circle cx="100" cy="42" r="2" />
            <circle cx="148" cy="68" r="2" />
            <circle cx="222" cy="38" r="2" />
          </g>
        </svg>
        {/* 左下角短走线 */}
        <svg className="absolute bottom-0 left-0 w-[180px]" viewBox="0 0 180 60" fill="none">
          <g stroke="rgba(217,119,6,.2)" strokeWidth="1">
            <path d="M0 22 H64 L84 42 H128" />
            <path d="M28 60 V46 L48 26" />
          </g>
          <g fill="rgba(217,119,6,.35)">
            <circle cx="128" cy="42" r="1.8" />
            <circle cx="48" cy="26" r="1.8" />
          </g>
        </svg>
        {/* 尘埃粒子 */}
        <>
          {[
            { l: '12%', t: '30%' }, { l: '30%', t: '68%' }, { l: '46%', t: '22%' },
            { l: '62%', t: '55%' }, { l: '78%', t: '78%' }, { l: '90%', t: '35%' },
          ].map((d, i) => (
            <span
              key={i}
              className="absolute h-[3px] w-[3px] rounded-full"
              style={{
                left: d.l, top: d.t,
                background: 'rgba(255,183,94,.5)',
                boxShadow: '0 0 6px rgba(255,158,47,.5)',
                opacity: 0.35 + (i % 3) * 0.2,
              }}
            />
          ))}
        </>
      </div>

      {/* 上层：品牌陈述区（不对称两栏） */}
      <div className="container mx-auto max-w-7xl px-4 py-14 md:py-16">
        <div className="grid items-start gap-10 md:grid-cols-[1.05fr_0.95fr_1fr] md:gap-12">
          {/* 左：品牌区 */}
          <div>
            <p
              className="font-mono text-[11px] font-medium tracking-[0.24em] text-primary"
              style={{ textTransform: 'uppercase' }}
            >
              Zizai Blog
            </p>
            <h3 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
              {t('stayRelevant')}
            </h3>
            <span
              className="mt-5 block h-[2px] w-10 rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--color-primary), transparent)' }}
            />
            <p className="mt-5 max-w-md font-mono text-[11px] leading-relaxed tracking-[0.18em] text-muted-foreground">
              DATA <span className="text-primary">×</span> AI <span className="text-primary">×</span>{' '}
              CONTENT <span className="text-primary">×</span> GROWTH
            </p>
          </div>

          {/* 中：站点导航 */}
          <div>
            <p
              className="font-mono text-[11px] font-medium tracking-[0.24em] text-primary"
              style={{ textTransform: 'uppercase' }}
            >
              Explore
            </p>
            <nav className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {exploreLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <span
                    className="h-[4px] w-[4px] rotate-45 bg-primary/50 transition-colors group-hover:bg-primary"
                    aria-hidden="true"
                  />
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 右：订阅组件（编辑风） */}
          <div>
            <p
              className="font-mono text-[11px] font-medium tracking-[0.24em] text-primary"
              style={{ textTransform: 'uppercase' }}
            >
              Newsletter
            </p>
            <div
              className="mt-3 rounded-xl border bg-background/40 p-1.5 transition-colors"
              style={{ borderColor: 'rgba(217, 119, 6, 0.22)' }}
            >
              <SubstackEmbed
                variant="form"
                buttonText={t('subscribeOnSubstack')}
                placeholder={t('emailPlaceholder')}
              />
            </div>
            <div className="mt-4">
              <SocialLinks iconSize={18} />
            </div>
          </div>
        </div>
      </div>

      {/* 分割线：低透明琥珀 hairline */}
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(217, 119, 6, 0.25), transparent)' }}
      />

      {/* 下层：紧凑工具条 */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* 导航与法律链接（分层） */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/about" className="font-medium transition-colors hover:text-primary">
              {t('about')}
            </Link>
            <Link href="/archive" className="font-medium transition-colors hover:text-primary">
              {t('archive')}
            </Link>
            <span className="hidden h-3 w-px bg-border md:inline-block" />
            <Link
              href="/privacy"
              className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              {t('privacy')}
            </Link>
            <Link
              href="/terms"
              className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              {t('terms')}
            </Link>
            <Link
              href="/collection-notice"
              className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              {t('collectionNotice')}
            </Link>
          </nav>

          {/* 版权 + RSS */}
          <p className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <a
              href="/feed.xml"
              className="font-mono text-[11px] tracking-[0.18em] transition-colors hover:text-primary"
            >
              RSS
            </a>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
