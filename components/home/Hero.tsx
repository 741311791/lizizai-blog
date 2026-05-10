/**
 * Hero 编辑精选模块
 *
 * 非对称布局：左侧大图（60%）+ 右侧精选文章信息 + 订阅 CTA。
 * 展示最新精选文章，替代原有纯文字 Hero。
 */

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getArticleImageUrl } from '@/lib/utils/image';
import type { Article } from '@/types/index';

interface HeroProps {
  article: Article;
  locale: string;
}

export default async function Hero({ article, locale }: HeroProps) {
  const t = await getTranslations('home');
  const tArticle = await getTranslations('article');
  const imageUrl = getArticleImageUrl(article.featuredImage, article.id);
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        locale === 'zh' ? 'zh-CN' : 'en-US',
        { month: 'short', day: '2-digit' }
      ).toUpperCase()
    : '';

  const contentType = article.contentType || 'article';

  // 根据内容类型返回不同的时间描述
  const timeLabel =
    contentType === 'podcast'
      ? tArticle('listenTime', { count: article.readingTime || 0 })
      : contentType === 'slides'
      ? tArticle('slideCount', { count: article.slideCount || 0 })
      : locale === 'zh'
      ? `${article.readingTime || 0} 分钟`
      : `${article.readingTime || 0} min`;

  // 封面图上的标签：优先显示内容类型，其次分类
  const badgeContent =
    contentType === 'podcast'
      ? `🎙️ ${tArticle('podcast')}`
      : contentType === 'slides'
      ? `📊 ${tArticle('slides')}`
      : article.category?.name;

  return (
    <section className="relative py-8 lg:py-12">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {/* 左侧大图 — 占 3 列（60%） */}
          <div className="lg:col-span-3">
            <Link href={`/article/${article.slug}`} className="block group">
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                <Image
                  src={imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  unoptimized={imageUrl.includes('picsum.photos')}
                />
                {/* 底部渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* 类型/分类标签 */}
                {badgeContent && (
                  <span className="absolute top-4 left-4 text-xs font-medium tracking-wide uppercase px-3 py-1 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm">
                    {badgeContent}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* 右侧精选信息 — 占 2 列（40%） */}
          <div className="lg:col-span-2 space-y-5">
            {/* 精选标签 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">
                {t('mostPopular')}
              </span>
              <span className="h-px flex-1 bg-border max-w-[60px]" />
            </div>

            {/* 文章标题 */}
            <Link href={`/article/${article.slug}`}>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight hover:text-primary transition-colors line-clamp-3">
                {article.title}
              </h1>
            </Link>

            {/* 摘要 */}
            {(article.subtitle || article.excerpt) && (
              <p className="text-muted-foreground leading-relaxed line-clamp-2">
                {article.subtitle || article.excerpt}
              </p>
            )}

            {/* 元信息 */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {article.author?.name || '李自在'}
              </span>
              <span>·</span>
              <span>{date}</span>
              {(article.readingTime || contentType === 'slides') && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{timeLabel}</span>
                  </div>
                </>
              )}
            </div>

            {/* 订阅 CTA */}
            <div className="pt-2">
              <Link href="/subscribe">
                <Button
                  size="lg"
                  className="gap-2 px-6 py-5 text-sm rounded-full"
                >
                  <Mail className="h-4 w-4" />
                  {t('ctaButton')}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
