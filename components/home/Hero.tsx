import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getArticleImageUrl, shouldSkipImageOptimization } from '@/lib/utils/image';
import { getTimeLabel, shouldShowTimeLabel } from '@/lib/content-utils';
import type { Article } from '@/types/index';

/**
 * Hero 编辑精选（V2）— mono 金标 + 电路走线背景 + meta mono 化
 * 布局保持左图右文非对称，仅升级视觉层
 */
export default async function Hero({ article, locale }: { article: Article; locale: string }) {
  const t = await getTranslations('home');
  const tArticle = await getTranslations('article');
  const imageUrl = getArticleImageUrl(article.featuredImage, article.id);
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: '2-digit',
      }).toUpperCase()
    : '';
  const timeLabel = getTimeLabel(tArticle, article.contentType, article.readingTime || 0, article.slideCount);

  return (
    <section className="relative overflow-hidden py-8 lg:py-12">
      {/* 背景点缀：右侧暖光 + 多组电路走线（焊盘/空心环/十字/尘埃全套 PCB 语言） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(520px 260px at 78% 45%, rgba(217,119,6,.06), transparent 70%)',
          }}
        />
        {/* 右上：三阶走线组 */}
        <svg className="absolute right-0 top-0 w-[260px]" viewBox="0 0 260 120" fill="none">
          <g stroke="rgba(217,119,6,.24)" strokeWidth="1">
            <path d="M260 16 H160 L138 38 H72" />
            <path d="M260 42 H196 L174 64 H128" />
            <path d="M260 68 H212 L190 90 H156" />
            <path d="M224 0 V10 L202 32" />
          </g>
          <g fill="rgba(217,119,6,.45)">
            <circle cx="72" cy="38" r="2.2" />
            <circle cx="128" cy="64" r="2.2" />
            <circle cx="156" cy="90" r="2.2" />
            <circle cx="202" cy="32" r="2.2" />
          </g>
          {/* 空心环焊盘 */}
          <circle cx="156" cy="90" r="6" stroke="rgba(217,119,6,.3)" strokeWidth="1" fill="none" />
          {/* 十字标记 */}
          <path d="M96 96 h10 M101 91 v10" stroke="rgba(217,119,6,.28)" strokeWidth="1" />
        </svg>
        {/* 左下：双走线 + 焊盘 */}
        <svg className="absolute bottom-0 left-0 w-[220px]" viewBox="0 0 220 70" fill="none">
          <g stroke="rgba(217,119,6,.2)" strokeWidth="1">
            <path d="M0 26 H84 L106 48 H150" />
            <path d="M0 52 H56 L78 30 H104" />
          </g>
          <g fill="rgba(217,119,6,.4)">
            <circle cx="150" cy="48" r="2.2" />
            <circle cx="104" cy="30" r="2.2" />
          </g>
          <circle cx="150" cy="48" r="6" stroke="rgba(217,119,6,.26)" strokeWidth="1" fill="none" />
        </svg>
        {/* 左上：十字 + 空心环 */}
        <svg className="absolute left-6 top-8 w-[60px]" viewBox="0 0 60 60" fill="none">
          <path d="M22 12 h12 M28 6 v12" stroke="rgba(217,119,6,.26)" strokeWidth="1" />
          <circle cx="44" cy="40" r="5" stroke="rgba(217,119,6,.24)" strokeWidth="1" fill="none" />
        </svg>
        {/* 尘埃粒子 */}
        {[
          { l: '18%', t: '22%' }, { l: '44%', t: '78%' }, { l: '66%', t: '18%' },
          { l: '88%', t: '62%' }, { l: '31%', t: '55%' },
        ].map((d, i) => (
          <span
            key={i}
            className="absolute h-[3px] w-[3px] rounded-full"
            style={{
              left: d.l,
              top: d.t,
              background: 'rgba(255,183,94,.45)',
              boxShadow: '0 0 6px rgba(255,158,47,.45)',
              opacity: 0.3 + (i % 3) * 0.18,
            }}
          />
        ))}
      </div>

      <div className="container relative">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-12">
          {/* 左侧大图 — 占 3 列（60%） */}
          <div className="lg:col-span-3">
            <Link href={`/article/${article.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted ring-1 ring-white/10 transition-shadow duration-500 group-hover:ring-primary/30">
                <Image
                  src={imageUrl}
                  alt={article.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 60vw, 750px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  unoptimized={shouldSkipImageOptimization(imageUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </Link>
          </div>

          {/* 右侧精选信息 — 占 2 列（40%） */}
          <div className="space-y-5 lg:col-span-2">
            {/* 精选标签 V2：菱形 + mono 金标 + 渐隐 rule */}
            <div className="flex items-center gap-2.5">
              <span
                className="h-[5px] w-[5px] rotate-45 bg-primary"
                style={{ boxShadow: '0 0 6px rgba(217,119,6,.7)' }}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] font-medium tracking-[0.26em] text-primary uppercase">
                {t('mostPopular')}
              </span>
              <span
                className="h-px max-w-[60px] flex-1"
                style={{ background: 'linear-gradient(90deg, rgba(217,119,6,.5), transparent)' }}
              />
            </div>

            <Link href={`/article/${article.slug}`}>
              <h1 className="font-serif text-2xl font-bold leading-tight transition-colors hover:text-primary line-clamp-3 md:text-3xl lg:text-4xl">
                {article.title}
              </h1>
            </Link>

            {(article.subtitle || article.excerpt) && (
              <p className="leading-relaxed text-muted-foreground line-clamp-2 text-pretty">
                {article.subtitle || article.excerpt}
              </p>
            )}

            {/* 元信息 V2：菱形分隔 + mono 日期 */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">{article.author?.name || '李自在'}</span>
              <span className="h-1 w-1 rotate-45 bg-border" aria-hidden="true" />
              <span className="font-mono text-[13px] tracking-wide">{date}</span>
              {shouldShowTimeLabel(article.contentType, article.readingTime) && (
                <>
                  <span className="h-1 w-1 rotate-45 bg-border" aria-hidden="true" />
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono text-[13px] tracking-wide">{timeLabel}</span>
                  </span>
                </>
              )}
            </div>

            {/* 订阅 CTA */}
            <div className="pt-2">
              <Link href="/subscribe">
                <Button size="lg" className="gap-2 rounded-full px-6 py-5 text-sm">
                  <Mail className="h-4 w-4" />
                  {t('ctaButton')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
