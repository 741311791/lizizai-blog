/**
 * AI 资讯日期选择器
 *
 * 横向滚动的日期胶囊，选中态高亮。
 * Client Component，因为需要交互。
 */

'use client';

import { cn } from '@/lib/utils';

interface AiNewsDateSelectorProps {
  /** 可用日期列表（YYYY-MM-DD） */
  dates: string[];
  /** 当前选中日期 */
  selectedDate: string | null;
  /** 日期变更回调 */
  onDateChange: (date: string) => void;
  /** locale */
  locale?: string;
}

export default function AiNewsDateSelector({
  dates,
  selectedDate,
  onDateChange,
  locale = 'zh',
}: AiNewsDateSelectorProps) {
  if (dates.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
      {dates.map((date) => {
        const isSelected = date === selectedDate;
        const label = new Date(date + 'T00:00:00').toLocaleDateString(
          locale === 'zh' ? 'zh-CN' : 'en-US',
          { month: 'short', day: '2-digit' }
        );

        return (
          <button
            key={date}
            onClick={() => onDateChange(date)}
            className={cn(
              'px-4 py-2 rounded-full text-sm whitespace-nowrap snap-start transition-all shrink-0',
              isSelected
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'bg-card text-muted-foreground border border-border hover:bg-accent/10'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
