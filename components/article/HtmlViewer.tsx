'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, RefreshCw, Maximize, Minimize } from 'lucide-react';

interface HtmlViewerProps {
  htmlUrl: string;
}

const TIMEOUT_MS = 5000;
const MIN_HEIGHT = 200;
const MAX_HEIGHT_MULTIPLIER = 2;

/**
 * HTML 内容查看器
 *
 * 仅通过 postMessage 接收 `html-content-height` 做高度自适应。
 * 目录（TOC）已由 HTML 内部自带（浮动按钮 + 抽屉），不再通过 postMessage 传递——
 * 旧方案在 sandbox="allow-scripts"（无 allow-same-origin）下 offsetTop 同步不可靠。
 *
 * 全屏沉浸模式：对容器调用 Fullscreen API，iframe 高度切到 100vh 独立滚动，
 * 此时 HTML 内置的 fixed 目录与 IntersectionObserver 高亮才能完美生效。
 */
export default function HtmlViewer({ htmlUrl }: HtmlViewerProps) {
  const t = useTranslations('article');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const r2Origin = useMemo(() => {
    try { return new URL(htmlUrl).origin; } catch { return ''; }
  }, [htmlUrl]);

  // 高度 clamp
  const clampHeight = useCallback((h: number) => {
    const max = window.innerHeight * MAX_HEIGHT_MULTIPLIER;
    return Math.max(MIN_HEIGHT, Math.min(h, max));
  }, []);

  // 节流：100ms 内只处理一次高度更新
  const lastUpdate = useRef(0);
  const throttledSetHeight = useCallback((height: number) => {
    const now = Date.now();
    if (now - lastUpdate.current < 100) return;
    lastUpdate.current = now;
    setIframeHeight(clampHeight(height));
  }, [clampHeight]);

  // 监听 postMessage（仅高度同步）
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (r2Origin && e.origin !== r2Origin && e.origin !== 'null') return;

      // 高度同步
      if (e.data?.type === 'html-content-height' && typeof e.data.height === 'number') {
        throttledSetHeight(e.data.height);
        setStatus('loaded');
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [r2Origin, throttledSetHeight]);

  // 超时兜底
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (status === 'loading') {
        setStatus('error');
      }
    }, TIMEOUT_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [htmlUrl, status]);

  // 全屏状态追踪（用于切换图标 + iframe 高度策略）
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // iframe 加载完成
  const handleLoad = useCallback(() => {
    if (status === 'loading') {
      setStatus('loaded');
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [status]);

  // 重试
  const handleRetry = useCallback(() => {
    setStatus('loading');
    setIframeHeight(500);
    if (iframeRef.current) {
      iframeRef.current.src = htmlUrl;
    }
  }, [htmlUrl]);

  // 切换全屏沉浸模式
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  // 错误状态
  if (status === 'error') {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="text-muted-foreground mb-4">{t('htmlError')}</div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            {t('htmlRetry')}
          </button>
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="size-3.5" />
            {t('htmlOpenInNewTab')}
          </a>
        </div>
      </div>
    );
  }

  // 全屏时 iframe 占满视口并独立滚动（内置 fixed 目录随之固定生效）
  const iframeHeightStyle = isFullscreen ? '100vh' : status === 'loaded' ? iframeHeight : 500;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden border border-border rounded-lg group [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-background"
    >
      <iframe
        ref={iframeRef}
        src={htmlUrl}
        sandbox="allow-scripts"
        title="HTML 内容查看器"
        aria-label="HTML 内容"
        tabIndex={0}
        onLoad={handleLoad}
        className="w-full border-0"
        style={{
          height: iframeHeightStyle,
          transition: isFullscreen ? 'none' : status === 'loaded' ? 'height 0.2s ease-out' : 'none',
        }}
      />
      {/* 全屏沉浸按钮 */}
      <button
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
        title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
        className="absolute top-3 right-3 z-10 size-9 rounded-lg border border-border bg-card/90 text-muted-foreground hover:text-primary hover:border-border-hover backdrop-blur-sm flex items-center justify-center transition-colors"
      >
        {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
      </button>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">{t('htmlLoading')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
