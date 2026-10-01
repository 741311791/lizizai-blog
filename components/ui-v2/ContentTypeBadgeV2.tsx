
/**
 * ContentTypeBadgeV2 — 内容类型徽章（编辑风升级版，预览组件）
 * 灰底 Badge → 透明底 hairline 胶囊 + 金色图标；类型推断逻辑同 ContentTypeBadge
 */

import { BookOpen, Mic, Presentation, Code2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Article } from '@/types/index';

interface ContentTypeBadgeV2Props {
  /** 文章对象，自动推断所有内容类型 */
  article?: Article;
  /** 兼容旧调用：单个 contentType */
  contentType?: string;
  categoryName?: string;
  compact?: boolean;
  className?: string;
}

/** hairline 胶囊基础样式：透明底 + 1px 边框，图标金色 */
const pill =
  'inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5 text-[11px] leading-none text-muted-foreground';

export default function ContentTypeBadgeV2({
  article,
  contentType,
  categoryName,
  compact = false,
  className,
}: ContentTypeBadgeV2Props) {
  const t = useTranslations('article');

  // 从 article 对象推断类型集合
  const types = new Set<string>();
  if (article?.contentTypes) {
    if (article.contentTypes.podcast) types.add('podcast');
    if (article.contentTypes.slides) types.add('slides');
    if (article.contentTypes.html) types.add('html');
    if (article.contentTypes.article) types.add('article');
  }
  // 兼容旧调用和旧数据
  if (types.size === 0 && (contentType || article?.contentType)) {
    types.add(contentType || article?.contentType || 'article');
  }
  if (types.size === 0) types.add('article');

  const badges: React.ReactNode[] = [];

  if (types.has('podcast')) {
    badges.push(
      <span key="podcast" className={`${pill} ${className || ''}`}>
        <Mic className="size-3 text-primary/80" aria-hidden="true" />
        {t('podcast')}
      </span>
    );
  }

  if (types.has('slides')) {
    badges.push(
      <span key="slides" className={`${pill} ${className || ''}`}>
        <Presentation className="size-3 text-primary/80" aria-hidden="true" />
        {t('slides')}
      </span>
    );
  }

  if (types.has('html')) {
    badges.push(
      <span key="html" className={`${pill} ${className || ''}`}>
        <Code2 className="size-3 text-primary/80" aria-hidden="true" />
        {t('html')}
      </span>
    );
  }

  // article 类型：仅在非 compact 或有 categoryName 时显示
  if (types.has('article') && !types.has('podcast') && !types.has('slides') && !types.has('html')) {
    if (categoryName) {
      badges.push(
        <span key="article" className={`${pill} ${className || ''}`}>
          <BookOpen className="size-3 text-primary/80" aria-hidden="true" />
          {categoryName}
        </span>
      );
    } else if (!compact) {
      badges.push(
        <span key="article" className={`${pill} ${className || ''}`}>
          <BookOpen className="size-3 text-primary/80" aria-hidden="true" />
          {t('articleType')}
        </span>
      );
    }
    return badges.length > 0 ? <>{badges}</> : null;
  }

  // 如果 article 类型与 podcast/slides/html 共存，不显示 article badge
  if (types.has('article') && (types.has('podcast') || types.has('slides') || types.has('html')) && categoryName) {
    badges.push(
      <span key="category" className={`${pill} ${className || ''}`}>
        <BookOpen className="size-3 text-primary/80" aria-hidden="true" />
        {categoryName}
      </span>
    );
  }

  return badges.length > 0 ? <>{badges}</> : null;
}
