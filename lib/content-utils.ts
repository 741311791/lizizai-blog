import type { ContentType } from '@/types/index';

/** 翻译函数类型 — next-intl 的 t 函数签名 */
export type TranslateFn = (key: string, params?: Record<string, number>) => string;

/**
 * 获取内容类型对应的时间描述文本
 *
 * 播客 → 收听时间，PPT → 页数，文章 → 阅读时间
 * 纯函数，可在 Server/Client Component 中使用
 */
export function getTimeLabel(
  t: TranslateFn,
  contentType: ContentType | undefined,
  readingTime: number,
  slideCount?: number,
): string {
  switch (contentType) {
    case 'podcast':
      return t('listenTime', { count: readingTime });
    case 'slides':
      return t('slideCount', { count: slideCount || 0 });
    default:
      return t('readingTime', { count: readingTime });
  }
}

/**
 * 获取内容类型对应的封面图标签文本
 *
 * 播客 → 🎙️ 播客，PPT → 📊 幻灯片，HTML → 📄 HTML，文章 → 分类名称
 */
export function getBadgeContent(
  t: TranslateFn,
  contentType: ContentType | undefined,
  categoryName?: string,
  slideCount?: number,
): string | null {
  switch (contentType) {
    case 'podcast':
      return `🎙️ ${t('podcast')}`;
    case 'slides':
      return slideCount ? `📊 ${t('slideCount', { count: slideCount })}` : `📊 ${t('slides')}`;
    case 'html':
      return `📄 ${t('html')}`;
    default:
      return categoryName || null;
  }
}

/**
 * 判断是否应显示时间标签
 *
 * 有阅读时间或是幻灯片类型时显示
 */
export function shouldShowTimeLabel(contentType: ContentType | undefined, readingTime?: number): boolean {
  return !!readingTime || contentType === 'slides';
}
