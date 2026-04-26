/**
 * 首页「每日 AI 资讯」模块
 *
 * Server Component，从 D1 获取当日资讯数据并渲染。
 * 位于 Stats Bar 和 ArticlesSection 之间。
 */

import { getDailyNews } from '@/lib/ai-news';
import DailyNewsFeatured from '@/components/ai-news/DailyNewsFeatured';
import DailyNewsCard from '@/components/ai-news/DailyNewsCard';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Sun } from 'lucide-react';

interface DailyNewsProps {
  locale: string;
}

export default async function DailyNews({ locale }: DailyNewsProps) {
  const t = await getTranslations('aiNews');
  const result = await getDailyNews();

  // 空数据 / 异常时整体隐藏
  if (result.isEmpty || result.isError || result.items.length === 0) {
    return null;
  }

  // 分离头条和普通资讯
  const featured = result.items.filter(item => item.importance >= 2);
  const regular = result.items.filter(item => item.importance < 2);

  // 格式化展示日期
  const displayDate = result.date
    ? new Date(result.date + 'T00:00:00').toLocaleDateString(
        locale === 'zh' ? 'zh-CN' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : '';

  return (
    <section className="py-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-accent" />
          <h2 className="text-xl md:text-2xl font-bold">
            {t('dailyTitle')}
          </h2>
          {displayDate && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              · {displayDate}
            </span>
          )}
        </div>
        <Link href="/daily-news">
          <Button variant="link" className="text-primary hover:text-primary/80 text-sm">
            {t('viewAll')} →
          </Button>
        </Link>
      </div>

      {/* 头条卡片 */}
      {featured.length > 0 && (
        <div className="mb-6">
          <DailyNewsFeatured item={featured[0]} locale={locale} />
        </div>
      )}

      {/* 普通资讯网格 */}
      {regular.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regular.slice(0, 6).map((item) => (
            <DailyNewsCard key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
