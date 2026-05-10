'use client';

import { useTranslations } from 'next-intl';
import type { SlideData } from '@/types/index';

interface MobileSlideNavProps {
  slides: SlideData[];
  currentIndex: number;
  onSlideClick: (index: number) => void;
}

/**
 * 移动端幻灯片导航（底部导航点 + 缩略图行）
 */
export default function MobileSlideNav({
  slides,
  currentIndex,
  onSlideClick,
}: MobileSlideNavProps) {
  const t = useTranslations('article');

  if (!slides || slides.length === 0) return null;

  return (
    <div className="lg:hidden mt-4 space-y-3">
      {/* 页码指示 */}
      <div className="text-center text-xs text-muted-foreground tabular-nums">
        {t('currentSlide', { current: currentIndex + 1, total: slides.length })}
      </div>

      {/* 导航点 */}
      {slides.length <= 12 && (
        <div className="flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSlideClick(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              aria-label={`第 ${idx + 1} 页`}
            />
          ))}
        </div>
      )}

      {/* 水平滚动缩略图 */}
      {slides.length > 3 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {slides.map((slide, idx) => {
            const firstLine = slide.markdown
              .split('\n')
              .find(l => l.trim())
              ?.replace(/^#+\s*/, '')
              .trim() || `${idx + 1}`;

            return (
              <button
                key={slide.id}
                onClick={() => onSlideClick(idx)}
                className={`flex-shrink-0 w-24 aspect-video rounded border-2 overflow-hidden snap-start transition-colors ${
                  idx === currentIndex ? 'border-primary' : 'border-border'
                }`}
              >
                <div className="w-full h-full bg-background flex items-center justify-center text-[8px] text-muted-foreground p-1 text-center leading-tight">
                  {firstLine.slice(0, 15)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
