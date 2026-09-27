'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Maximize2, X } from 'lucide-react';
import type { SlideData } from '@/types/index';

// react-markdown 仅 markdown 模式加载，html_slides 模式不打包
const MarkdownSlide = dynamic(() => import('./MarkdownSlide'), {
  loading: () => <div className="w-3/4 h-8 rounded bg-muted animate-pulse" />,
});

interface SlideViewerProps {
  mode: 'markdown' | 'html';
  slides?: SlideData[];
  currentIndex?: number;
  onSlideChange?: (index: number) => void;
  slidesBaseUrl?: string;
  manifest?: { file: string; label: string }[];
}

/** 焦点圈定：Tab 循环聚焦在容器内的可聚焦元素内 */
function trapTab(e: KeyboardEvent, container: HTMLElement) {
  if (e.key !== 'Tab') return;
  const focusables = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
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
  const fullscreenCloseRef = useRef<HTMLButtonElement>(null);
  const total = slides.length;
  const currentSlide = slides[currentIndex] || null;

  // Markdown 模式导航（hooks 必须在所有条件返回之前调用）
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < total) {
      onSlideChange?.(index);
      setShowNotes(false);
    }
  }, [total, onSlideChange]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  // Markdown 键盘导航：输入控件内不劫持方向键（评论框移动光标）
  useEffect(() => {
    if (mode !== 'markdown') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, goPrev, goNext]);

  // 全屏模式：ESC 关闭 + 焦点圈定 + 初始聚焦关闭按钮
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsFullscreen(false);
      } else if (fullscreenRef.current) {
        trapTab(e, fullscreenRef.current);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => fullscreenCloseRef.current?.focus());
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
              sandbox="allow-scripts"
              loading="lazy"
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
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-[0.96]"
                    aria-label="上一页"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onSlideChange?.(Math.min(manifest.length - 1, currentIndex + 1))}
                    disabled={currentIndex >= manifest.length - 1}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-[0.96]"
                    aria-label="下一页"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-[0.96]"
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
                      className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors active:scale-[0.96]"
                      aria-label="上一页"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onSlideChange?.(Math.min(manifest.length - 1, currentIndex + 1))}
                      disabled={currentIndex >= manifest.length - 1}
                      className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors active:scale-[0.96]"
                      aria-label="下一页"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                )}
                <button
                  ref={fullscreenCloseRef}
                  onClick={() => setIsFullscreen(false)}
                  className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors active:scale-[0.96]"
                  aria-label={t('slideExitFullscreen')}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* 幻灯片内容 */}
            {/* min-h-0：允许 flex 子项收缩，防止内容撑破溢出 */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
              {/*
                宽度双重约束，保持 16:9 在任意视口比例下都不溢出：
                1) 92vw —— 宽度上限
                2) (100dvh - 180px) * 16/9 —— 按可用高度反推宽度上限
                   180px 预留给顶部工具栏(~58px) + 底部缩略图(~77px) + 内边距(~32px) + 余量
              */}
              <div
                className="relative aspect-video rounded-lg overflow-hidden shadow-2xl shadow-black/50"
                style={{ width: 'min(92vw, calc((100dvh - 180px) * 16 / 9))' }}
              >
                {/* 全屏帧为当前可视内容，保持 eager 立即加载 */}
                <iframe
                  key={`fullscreen-${slideUrl}`}
                  src={slideUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  sandbox="allow-scripts"
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
                        className={`flex-shrink-0 w-20 aspect-video rounded-md overflow-hidden border-2 transition-[opacity,transform,border-color] ${
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
            <MarkdownSlide markdown={currentSlide.markdown} />
          ) : (
            <p className="text-muted-foreground">空幻灯片</p>
          )}

          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/60 flex items-center justify-center hover:bg-primary transition-colors active:scale-[0.96]"
              aria-label="上一页"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {currentIndex < total - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/60 flex items-center justify-center hover:bg-primary transition-colors active:scale-[0.96]"
              aria-label="下一页"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentSlide?.notes && (
        <div className="mt-4 rounded-lg border border-border bg-card p-3.5">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-1"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform duration-200 ${showNotes ? 'rotate-90' : ''}`}
              aria-hidden="true"
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
