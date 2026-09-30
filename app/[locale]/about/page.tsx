import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Twitter, Linkedin, Youtube, Globe } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/lib/seo';
import AboutHeroV2 from '@/components/ui-v2/AboutHeroV2';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const isZh = locale === 'zh';
  const url = isZh ? `${siteConfig.url}/about` : `${siteConfig.url}/en/about`;
  return {
    title: t('title'),
    description: t('tagline'),
    alternates: {
      canonical: url,
      languages: {
        zh: `${siteConfig.url}/about`,
        en: `${siteConfig.url}/en/about`,
      },
    },
  };
}

const SOCIALS = [
  { href: 'https://twitter.com/zizaiblog', Icon: Twitter, label: 'Twitter' },
  { href: 'https://youtube.com/@zizaili', Icon: Youtube, label: 'YouTube' },
  { href: 'https://www.linkedin.com/in/zizai-li', Icon: Linkedin, label: 'LinkedIn' },
] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const learnCards = [
    { title: t('learn1Title'), desc: t('learn1Desc') },
    { title: t('learn2Title'), desc: t('learn2Desc') },
    { title: t('learn3Title'), desc: t('learn3Desc') },
    { title: t('learn4Title'), desc: t('learn4Desc') },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Hero V2 */}
      <AboutHeroV2 avatar="/avator/avatar_smile.png" name={t('title')} tagline={t('tagline')} />

      <Separator className="my-12" />

      {/* Mission */}
      <section className="mb-12 space-y-6">
        <h2 className="text-3xl font-bold">{t('missionTitle')}</h2>
        <div className="max-w-none space-y-5">
          <p className="text-muted-foreground leading-relaxed text-pretty">{t('missionP1')}</p>
          <p className="text-muted-foreground leading-relaxed text-pretty">{t('missionP2')}</p>
          <p className="text-muted-foreground leading-relaxed text-pretty">{t('missionP3')}</p>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Author */}
      <section className="mb-12 space-y-6">
        <h2 className="text-3xl font-bold">{t('authorTitle')}</h2>
        <div className="max-w-none space-y-5">
          <p className="text-muted-foreground leading-relaxed text-pretty">{t('authorP1')}</p>
          <p className="text-muted-foreground leading-relaxed text-pretty">{t('authorP2')}</p>
        </div>

        {/* Social Links — 真实外链 */}
        <div className="flex flex-wrap gap-4 pt-6">
          <Button variant="outline" size="lg" asChild className="gap-2">
            <a href="mailto:liancheng.ly@gmail.com">
              <Mail className="h-5 w-5" aria-hidden="true" />
              Email
            </a>
          </Button>
          {SOCIALS.map(({ href, Icon, label }) => (
            <Button key={label} variant="outline" size="lg" asChild className="gap-2">
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </a>
            </Button>
          ))}
          <Button variant="outline" size="lg" asChild className="gap-2">
            <a href={siteConfig.url} target="_blank" rel="noopener noreferrer">
              <Globe className="h-5 w-5" aria-hidden="true" />
              {t('website')}
            </a>
          </Button>
        </div>
      </section>

      <Separator className="my-12" />

      {/* What You'll Learn */}
      <section className="mb-12 space-y-6">
        <h2 className="text-3xl font-bold">{t('learnTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {learnCards.map((card) => (
            <div key={card.title} className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
              <p className="text-muted-foreground text-pretty">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-12" />

      {/* Subscribe CTA */}
      <section className="text-center space-y-6 py-12 px-6 rounded-lg bg-muted/50">
        <h2 className="text-3xl font-bold">{t('ctaTitle')}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          {t('ctaDesc')}
        </p>
        <Button size="lg" asChild className="bg-primary hover:bg-primary/90 gap-2">
          <Link href="/subscribe">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {t('subscribeBtn')}
          </Link>
        </Button>
      </section>
    </div>
  );
}
