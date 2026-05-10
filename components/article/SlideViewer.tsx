'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SlideData } from '@/types/index';

interface SlideViewerProps {
  mode: 'markdown' | 'html';
  // markdown 模式参数
  slides?: SlideData[];
  currentIndex?: number;
  onSlideChange?: (index: number) => void;
  // html 模式参数
  slidesBaseUrl?: string;
}

/**
 * 幻灯片查看器
 * 支持两种模式：
 * - markdown：ReactMarkdown 渲染 Markdown 幻灯片（旧架构）
 * - html：iframe 嵌入 HTML 幻灯片播放器（新架构）
 */
export default function SlideViewer({
  mode,
  slides = [],
  currentIndex = 0,
  onSlideChange,
  slidesBaseUrl,
}: SlideViewerProps) {
  const t = useTranslations('article');
  const [showNotes, setShowNotes] = useState(false);
  const total = slides.length;
  const currentSlide = slides[currentIndex] || null;

  // ── HTML 模式 ──
  if (mode === 'html' && slidesBaseUrl) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden border border-border">
        <div className="aspect-video bg-background">
          <iframe
            src={`${slidesBaseUrl}/index.html`}
            className="w-full h-full border-0"
            allowFullScreen
            title="幻灯片"
          />
        </div>
      </div>
    );
  }

  // ── Markdown 模式 ──

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < total) {
      onSlideChange?.(index);
      setShowNotes(false);
    }
  }, [total, onSlideChange]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-border bg-card flex items-center justify-center aspect-video">
        <p className="text-muted-foreground">暂无幻灯片数据</p>
      </div>
    );
  }

  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div>
      {/* 幻灯片查看器 */}
      <div className="relative w-full rounded-lg overflow-hidden border border-border">
        {/* 16:9 画布 */}
        <div className="aspect-video bg-background flex items-center justify-center relative">
          {currentSlide ? (
            <div key={currentSlide.id} className="text-center px-8 max-w-[85%] prose prose-neutral prose-lg dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentSlide.markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground">空幻灯片</p>
          )}

          {/* 上一页按钮 */}
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="上一页"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* 下一页按钮 */}
          {currentIndex < total - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="下一页"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* 页码 */}
          <div className="absolute bottom-2 right-2.5 bg-background/70 px-2 py-0.5 rounded text-xs text-muted-foreground tabular-nums">
            {t('currentSlide', { current: currentIndex + 1, total })}
          </div>
        </div>

        {/* 进度条 */}
        <div className="h-0.5 bg-secondary">
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 页面笔记 */}
      {currentSlide?.notes && (
        <div className="mt-4 rounded-lg border border-border bg-card p-3.5">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform ${showNotes ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {t('slideNotes')}
          </button>
          {showNotes && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {currentSlide.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
