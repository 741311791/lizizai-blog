'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback((imgSrc: string) => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setSrc(imgSrc);
  }, []);

  const close = useCallback(() => {
    setSrc(null);
  }, []);

  // 打开时锁背景滚动、聚焦关闭按钮；关闭后归还焦点
  useEffect(() => {
    if (!src) {
      lastFocusRef.current?.focus?.();
      return;
    }
    document.body.style.overflow = 'hidden';
    // 等图片层挂载后聚焦
    requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.body.style.overflow = '';
    };
  }, [src]);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // 仅委托正文容器内的图片：相关文章卡片/评论区图片不触发灯箱
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.article-content')) {
        const imgSrc = (target as HTMLImageElement).src;
        if (imgSrc) {
          e.preventDefault();
          e.stopPropagation();
          open(imgSrc);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [open]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in duration-200"
      onClick={close}
    >
      <button
        ref={closeBtnRef}
        onClick={close}
        className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white/90 hover:text-white hover:bg-black/70 transition-colors active:scale-[0.96]"
        aria-label="关闭"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt="放大图片"
        className="max-w-[90vw] max-h-[90vh] object-contain animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
