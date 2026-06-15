'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SlideData } from '@/types/index';

interface SlideViewerProps {
  mode: 'markdown' | 'html';
  slides?: SlideData[];
  currentIndex?: number;
  onSlideChange?: (index: number) => void;
  slidesBaseUrl?: string;
  manifest?: { file: string; label: string }[];
}

/**
 * 幻灯片查看器
 * - markdown：ReactMarkdown 渲染（旧架构）
 * - html：iframe 嵌入单页幻灯片（新架构），支持全屏预览
 */
export default function SlideViewer({
  mode,
  slides = [],
  currentIndex = 0,
  onSlideChange,
  slidesBaseUrl,
  manifest = [],
}: SlideViewerProps) {
  const t = useTranslations('article');
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const total = slides.length;
  const currentSlide = slides[currentIndex] || null;

  // Markdown 模式导航（hooks 必须在所有条件返回之前调用）
  const goTo = (index: number) => {
    if (index >= 0 && index < total) {
      onSlideChange?.(index);
      setShowNotes(false);
    }
  };

  const goPrev = () => goTo(currentIndex - 1);
  const goNext = () => goTo(currentIndex + 1);

  // Markdown 键盘导航
  useEffect(() => {
    if (mode !== 'markdown') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, goPrev, goNext]);

  // 全屏模式 ESC 关闭
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // ── HTML 模式 ──
  if (mode === 'html' && slidesBaseUrl) {
    const slideFile = manifest[currentIndex]?.file;
    const slideUrl = slideFile
      ? `${slidesBaseUrl}/${slideFile}`
      : `${slidesBaseUrl}/index.html`;
    const slideLabel = manifest[currentIndex]?.label || `${currentIndex + 1}`;

    return (
      <>
        <div className="relative w-full rounded-lg overflow-hidden border border-border">
          <div className="aspect-video bg-background">
            <iframe
              key={slideUrl}
              src={slideUrl}
              className="w-full h-full border-0"
              allowFullScreen
              title={`幻灯片 - ${slideLabel}`}
            />
          </div>

          {/* 控制栏 */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-card/50">
            <span className="text-xs text-muted-foreground tabular-nums">
              {t('currentSlide', { current: currentIndex + 1, total: manifest.length })}
              {slideLabel && manifest.length > 0 && (
                <span className="ml-2 text-muted-foreground/60">{slideLabel}</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {manifest.length > 1 && (
                <>
                  <button
                    onClick={() => onSlideChange?.(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex <= 0}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="上一页"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onSlideChange?.(Math.min(manifest.length - 1, currentIndex + 1))}
                    disabled={currentIndex >= manifest.length - 1}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="下一页"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label={t('slideFullscreen')}
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 全屏预览 Modal */}
        {isFullscreen && (
          <div
            ref={fullscreenRef}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={(e) => {
              if (e.target === fullscreenRef.current) setIsFullscreen(false);
            }}
          >
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/50">
              <span className="text-sm text-white/70">
                {t('currentSlide', { current: currentIndex + 1, total: manifest.length })}
                {slideLabel && <span className="ml-2 text-white/40">{slideLabel}</span>}
              </span>
              <div className="flex items-center gap-2">
                {manifest.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSlideChange?.(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex <= 0}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                      aria-label="上一页"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onSlideChange?.(Math.min(manifest.length - 1, currentIndex + 1))}
                      disabled={currentIndex >= manifest.length - 1}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                      aria-label="下一页"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={t('slideExitFullscreen')}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* 幻灯片内容 */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-[90vw] aspect-video rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  key={`fullscreen-${slideUrl}`}
                  src={slideUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title={`幻灯片全屏 - ${slideLabel}`}
                />
              </div>
            </div>

            {/* 底部缩略图 */}
            {manifest.length > 1 && (
              <div className="px-4 pb-4">
                <div className="flex gap-2 justify-center overflow-x-auto py-2">
                  {manifest.map((item, idx) => {
                    const fileName = item.file.replace(/^slides\//, '').replace(/\.html$/, '');
                    const screenshotUrl = `${slidesBaseUrl}/screenshots/${fileName}.png`;
                    return (
                      <button
                        key={item.file}
                        onClick={() => onSlideChange?.(idx)}
                        className={`flex-shrink-0 w-20 aspect-video rounded-md overflow-hidden border-2 transition-all ${
                          idx === currentIndex
                            ? 'border-white/80 scale-105'
                            : 'border-white/20 opacity-50 hover:opacity-80'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={screenshotUrl}
                          alt={item.label || `${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // ── Markdown 模式 ──

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

          <div className="absolute bottom-2 right-2.5 bg-background/70 px-2 py-0.5 rounded text-xs text-muted-foreground tabular-nums">
            {t('currentSlide', { current: currentIndex + 1, total })}
          </div>
        </div>

        <div className="h-0.5 bg-secondary">
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

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
