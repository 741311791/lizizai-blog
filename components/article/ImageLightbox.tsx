'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox() {
  const [src, setSrc] = useState<string | null>(null);

  const open = useCallback((imgSrc: string) => {
    setSrc(imgSrc);
  }, []);

  const close = useCallback(() => {
    setSrc(null);
  }, []);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // 点击文章中的图片打开灯箱
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('article')) {
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
        onClick={close}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
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
