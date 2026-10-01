import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import SubscribeFormV2 from '@/components/ui-v2/SubscribeFormV2';
import { siteConfig } from '@/lib/seo';
import type { Metadata } from 'next';

interface SubscribePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: SubscribePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'subscribe' });
  const isZh = locale === 'zh';
  const url = isZh ? `${siteConfig.url}/subscribe` : `${siteConfig.url}/en/subscribe`;
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: url,
      languages: {
        zh: `${siteConfig.url}/subscribe`,
        en: `${siteConfig.url}/en/subscribe`,
      },
    },
  };
}

export default async function SubscribePage({ params }: SubscribePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('subscribe');
  const tc = await getTranslations('common');
  const tf = await getTranslations('footer');

  const benefits = [
    { title: t('benefitWeekly'), description: t('benefitWeeklyDesc') },
    { title: t('benefitEarly'), description: t('benefitEarlyDesc') },
    { title: t('benefitFree'), description: t('benefitFreeDesc') },
    { title: t('benefitCommunity'), description: t('benefitCommunityDesc') },
  ];

  const features = [t('noSpam'), t('unsubscribeAnytime'), t('freeForever')];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('backToHome')}
      </Link>

      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
        {/* 左列：编辑风页头 + mono 序号 benefits 目录 */}
        <div className="space-y-8">
          <div className="relative space-y-4">
            {/* 页头暖光点缀 */}
            <div
              className="pointer-events-none absolute -top-6 left-0 h-40 w-[120%]"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(420px 130px at 10% -10%, rgba(217,119,6,.08), transparent 70%)',
              }}
            />
            <p className="relative font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-primary">
              Newsletter
            </p>
            <h1 className="relative font-serif text-4xl font-black tracking-tight text-balance lg:text-5xl">
              {t('title')}
            </h1>
            <span
              className="relative block h-[2px] w-12 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-primary), transparent)',
              }}
            />
            <p className="relative max-w-lg text-xl text-muted-foreground text-pretty">
              {t('subtitle')}
            </p>
          </div>

          {/* benefits：mono 序号 + hairline 目录式列表 */}
          <div>
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex gap-5 border-b border-border/60 py-4 first:border-t first:border-border/60"
              >
                <span className="w-6 shrink-0 pt-0.5 font-mono text-[11px] font-medium tracking-[0.18em] text-primary/80">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="space-y-1">
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右列：订阅卡（sticky） */}
        <div className="lg:sticky lg:top-8">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-8">
            {/* 卡片顶部暖光 */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(300px 100px at 50% -30%, rgba(217,119,6,.10), transparent 70%)',
              }}
            />
            <p className="relative font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-primary">
              Free Weekly
            </p>
            <h2 className="relative mt-3 font-serif text-2xl font-bold tracking-tight">
              {t('subscribeOnSubstack')}
            </h2>
            <p className="relative mb-6 mt-2 text-sm text-muted-foreground">
              {t('confirmHint')}
            </p>

            <SubscribeFormV2
              buttonText={t('subscribeForFree')}
              placeholder={t('emailPlaceholder')}
              emailLabel={t('emailPlaceholder')}
            />

            <div className="space-y-2.5 pt-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <span
                    className="font-mono text-[8px] text-primary"
                    aria-hidden="true"
                  >
                    ◆
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border/60 pt-4">
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                <Link
                  href="/terms"
                  className="text-primary/80 transition-colors hover:text-primary hover:underline"
                >
                  {tf('terms')}
                </Link>
                {' · '}
                <Link
                  href="/privacy"
                  className="text-primary/80 transition-colors hover:text-primary hover:underline"
                >
                  {tf('privacy')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
