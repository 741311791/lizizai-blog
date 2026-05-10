'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import SidebarStats from './SidebarStats';
import type { Article, SlideData } from '@/types/index';

interface SlidesSidebarProps {
  slides: SlideData[];
  currentIndex: number;
  onSlideClick: (index: number) => void;
  article: Article;
}

/**
 * 幻灯片侧边栏
 *
 * 支持两种模式：
 * - Markdown 幻灯片：文字缩略图网格
 * - HTML 幻灯片：截图缩略图网格（基于 manifest + screenshots）
 */
export default function SlidesSidebar({
  slides,
  currentIndex,
  onSlideClick,
  article,
}: SlidesSidebarProps) {
  const t = useTranslations('article');

  const ct = article.contentTypes;
  const isHtmlSlides = ct?.slides?.source === 'html_slides';
  const hasScreenshots = ct?.slides?.hasScreenshots && article.slidesBaseUrl;
  const manifest = ct?.slides?.manifest;

  // HTML 幻灯片 + 截图：使用截图图片作为缩略图
  if (isHtmlSlides && hasScreenshots && manifest && manifest.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('slideNav')}
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {manifest.map((item, idx) => {
              // 从 slides/01-cover.html 推导截图路径 screenshots/01-cover.png
              const slideFileName = item.file.replace(/^slides\//, '').replace(/\.html$/, '');
              const screenshotUrl = `${article.slidesBaseUrl}/screenshots/${slideFileName}.png`;

              return (
                <div
                  key={item.file}
                  onClick={() => onSlideClick(idx)}
                  className={cn(
                    'aspect-video rounded border-2 cursor-pointer overflow-hidden relative transition-colors',
                    idx === currentIndex
                      ? 'border-primary'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <Image
                    src={screenshotUrl}
                    alt={item.label || `幻灯片 ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                    unoptimized
                  />
                  <span className="absolute bottom-0 right-1 text-[8px] text-white/80 bg-black/40 px-0.5 rounded-sm tabular-nums">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <SidebarStats article={article} />
      </div>
    );
  }

  // Markdown 幻灯片或 HTML 无截图：使用文字缩略图
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('slideNav')}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {slides.map((slide, idx) => {
            const firstLine = slide.markdown
              .split('\n')
              .find(l => l.trim())
              ?.replace(/^#+\s*/, '')
              .trim() || `${idx + 1}`;

            return (
              <div
                key={slide.id}
                onClick={() => onSlideClick(idx)}
                className={cn(
                  'aspect-video rounded border-2 cursor-pointer overflow-hidden relative transition-colors',
                  idx === currentIndex
                    ? 'border-primary'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                <div className="w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-sm bg-background flex items-center justify-center text-[8px] text-muted-foreground p-1 text-center leading-tight m-0.5">
                  {firstLine.slice(0, 20)}
                </div>
                <span className="absolute bottom-0 right-1 text-[8px] text-muted-foreground tabular-nums">
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <SidebarStats article={article} />
    </div>
  );
}
