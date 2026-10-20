'use client';

/**
 * Newsletter 订阅引导条（编辑风）
 *
 * 与 /subscribe 订阅卡同构：暖光 + mono Newsletter 标签 + serif 标题 + SubscribeFormV2。
 * 使用位置：daily-news 分类页、文章详情页正文尾。
 * 文案走 messages subscribe 段（hintKey 可切换提示语）。
 */

import { useTranslations } from 'next-intl';
import SubscribeFormV2 from '@/components/ui-v2/SubscribeFormV2';

interface NewsletterCtaProps {
  /** 提示文案 key（subscribe 段内）：文章尾用 articleCtaHint，daily-news 用 dailyNewsHint */
  hintKey?: 'articleCtaHint' | 'dailyNewsHint';
  /** 外层容器类名（如页间距） */
  className?: string;
}

export default function NewsletterCta({
  hintKey = 'articleCtaHint',
  className,
}: NewsletterCtaProps) {
  const t = useTranslations('subscribe');

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card p-6 ${className ?? ''}`}
    >
      {/* 卡片顶部暖光（与 /subscribe 订阅卡同构） */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(300px 80px at 20% -40%, rgba(217,119,6,.10), transparent 70%)',
        }}
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-primary">
            Newsletter
          </p>
          <h2 className="font-serif text-lg font-bold tracking-tight">
            {t('subscribeOnSubstack')}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">{t(hintKey)}</p>
        </div>
        <SubscribeFormV2
          className="w-full md:w-80"
          buttonText={t('subscribeForFree')}
          placeholder={t('emailPlaceholder')}
          emailLabel={t('emailPlaceholder')}
        />
      </div>
    </div>
  );
}
