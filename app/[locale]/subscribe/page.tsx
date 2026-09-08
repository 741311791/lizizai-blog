'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Zap, BookOpen, Users, Check, ArrowLeft } from 'lucide-react';
import SubstackEmbed from '@/components/subscribe/SubstackEmbed';

export default function SubscribePage() {
  const t = useTranslations('subscribe');
  const tc = useTranslations('common');
  const tf = useTranslations('footer');

  const benefits = [
    { icon: Sparkles, title: t('benefitWeekly'), description: t('benefitWeeklyDesc') },
    { icon: Zap, title: t('benefitEarly'), description: t('benefitEarlyDesc') },
    { icon: BookOpen, title: t('benefitFree'), description: t('benefitFreeDesc') },
    { icon: Users, title: t('benefitCommunity'), description: t('benefitCommunityDesc') },
  ];

  const features = [t('noSpam'), t('unsubscribeAnytime'), t('freeForever')];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('backToHome')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* 左侧：订阅价值 */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{t('title')}</h1>
            <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
          </div>

          <Separator />

          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：Substack 订阅入口 */}
        <div className="lg:sticky lg:top-8">
          <div className="p-8 rounded-lg border border-border bg-card shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{t('subscribeOnSubstack')}</h2>
            <p className="text-muted-foreground mb-6">{t('confirmHint')}</p>

            <SubstackEmbed
              variant="form"
              buttonText={t('subscribeForFree')}
              placeholder={t('emailPlaceholder')}
            />

            <div className="space-y-2 pt-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <p className="text-xs text-center text-muted-foreground">
              <Link href="/terms" className="text-primary hover:underline">
                {tf('terms')}
              </Link>
              {' · '}
              <Link href="/privacy" className="text-primary hover:underline">
                {tf('privacy')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
