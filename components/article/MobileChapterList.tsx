'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatTime } from '@/lib/utils/format';

interface Chapter {
  id: string;
  title: string;
  startTime: number;
}

interface MobileChapterListProps {
  chapters: Chapter[];
  activeIndex: number;
  onChapterClick: (startTime: number) => void;
}

/**
 * 移动端播客章节导航（手风琴）
 */
export default function MobileChapterList({
  chapters,
  activeIndex,
  onChapterClick,
}: MobileChapterListProps) {
  const t = useTranslations('article');
  const [open, setOpen] = useState(false);

  if (!chapters || chapters.length === 0) return null;

  return (
    <div className="lg:hidden border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4" />
          {t('chapters')} ({chapters.length})
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <nav className="border-t border-border px-4 py-2 max-h-60 overflow-y-auto">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => {
                onChapterClick(ch.startTime);
              }}
              className={`block w-full text-left text-sm py-1.5 hover:text-primary transition-colors ${
                idx === activeIndex ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              <span className="tabular-nums mr-2">{formatTime(ch.startTime)}</span>
              {ch.title}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
