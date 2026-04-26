/**
 * AI 资讯归档页面
 *
 * 路由：/[locale]/daily-news
 * 支持按日期浏览历史资讯，通过 URL 参数 ?tag=xxx 按标签筛选。
 */

import { getDailyNews, getAvailableDates } from '@/lib/ai-news';
import { getTranslations } from 'next-intl/server';
import { Sun } from 'lucide-react';
import AiNewsArchiveClient from './AiNewsArchiveClient';

export const revalidate = 3600; // ISR: 每小时重新验证

export async function generateMetadata() {
  return {
    title: 'AI 资讯归档 - Zizai Blog',
    description: '浏览每日 AI 行业资讯，包括大模型、开源项目、产品发布等。',
  };
}

interface AiNewsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; tag?: string }>;
}

export default async function AiNewsPage({ params, searchParams }: AiNewsPageProps) {
  const { locale } = await params;
  const { date, tag } = await searchParams;
  const t = await getTranslations('aiNews');

  // 并行获取：资讯数据 + 可用日期列表
  const [newsResult, availableDates] = await Promise.all([
    getDailyNews(date, tag),
    getAvailableDates(30),
  ]);

  // 分离头条和普通资讯
  const featured = newsResult.items.filter(item => item.importance >= 2);
  const regular = newsResult.items.filter(item => item.importance < 2);
  const currentDate = newsResult.date || date || null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <Sun className="h-6 w-6 text-accent" />
        <h1 className="text-2xl md:text-3xl font-bold">{t('archiveTitle')}</h1>
        {tag && (
          <span className="text-sm text-muted-foreground bg-accent/10 px-2 py-0.5 rounded-full">
            {t('filteredBy')}: {tag}
          </span>
        )}
      </div>

      {/* 日期选择器 + 资讯列表（Client 交互部分） */}
      <AiNewsArchiveClient
        dates={availableDates}
        initialDate={currentDate}
        tag={tag || null}
        locale={locale}
        featured={featured}
        regular={regular}
        isEmpty={newsResult.isEmpty || newsResult.items.length === 0}
        translations={{
          noData: t('noData'),
          loadMore: t('loadMore'),
        }}
      />
    </div>
  );
}
