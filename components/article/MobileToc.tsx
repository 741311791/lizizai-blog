'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { extractHeadings, type Heading } from '@/lib/utils/heading';
import { cn } from '@/lib/utils';

interface MobileTocProps {
  content: string;
}

export default function MobileToc({ content }: MobileTocProps) {
  const t = useTranslations('article');
  const [open, setOpen] = useState(false);
  const headings = extractHeadings(content);

  if (headings.length === 0) return null;

  const handleClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="lg:hidden border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4" />
          {t('tocWithCount', { count: headings.length })}
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <nav className="border-t border-border px-4 py-2 max-h-60 overflow-y-auto">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => handleClick(heading.id)}
              className={cn(
                'block w-full text-left text-sm py-1.5 hover:text-primary transition-colors',
                heading.level === 2 && 'pl-0 font-medium',
                heading.level === 3 && 'pl-4 text-muted-foreground',
              )}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
