'use client';

import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, RefreshCw } from 'lucide-react';

export interface HtmlHeading {
  id: string;
  text: string;
  level: number;
  top: number;
}

export interface HtmlViewerHandle {
  scrollToHeading: (top: number) => void;
  getIframeRect: () => DOMRect | null;
}

interface HtmlViewerProps {
  htmlUrl: string;
  onTocUpdate?: (headings: HtmlHeading[]) => void;
}

const TIMEOUT_MS = 5000;
const MIN_HEIGHT = 200;
const MAX_HEIGHT_MULTIPLIER = 2;

const HtmlViewer = forwardRef<HtmlViewerHandle, HtmlViewerProps>(function HtmlViewer({ htmlUrl, onTocUpdate }, ref) {
  const t = useTranslations('article');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // 用 ref 稳定回调，避免 postMessage 监听器频繁重建
  const onTocUpdateRef = useRef(onTocUpdate);
  onTocUpdateRef.current = onTocUpdate;

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    scrollToHeading(top: number) {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const iframeRect = iframe.getBoundingClientRect();
      const headerOffset = 100;
      window.scrollTo({
        top: iframeRect.top + window.scrollY + top - headerOffset,
        behavior: 'smooth',
      });
    },
    getIframeRect() {
      return iframeRef.current?.getBoundingClientRect() ?? null;
    },
  }));

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

  // 监听 postMessage（高度 + TOC）
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (r2Origin && e.origin !== r2Origin && e.origin !== 'null') return;

      // 高度同步
      if (e.data?.type === 'html-content-height' && typeof e.data.height === 'number') {
        throttledSetHeight(e.data.height);
        setStatus('loaded');
        if (timerRef.current) clearTimeout(timerRef.current);
      }

      // TOC 同步
      if (e.data?.type === 'html-toc' && Array.isArray(e.data.headings)) {
        onTocUpdateRef.current?.(e.data.headings);
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

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-border">
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
          height: status === 'loaded' ? iframeHeight : 500,
          transition: status === 'loaded' ? 'height 0.2s ease-out' : 'none',
        }}
      />
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
});

export default HtmlViewer;
