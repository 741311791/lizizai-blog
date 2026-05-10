/**
 * 首页「每日资讯」模块
 *
 * 水平滚动卡片条，方案 C 情报中心风格。
 * 每张卡片包含分类标签、标题、时间戳，hover 有提升效果。
 */

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight } from 'lucide-react';
import { getArticlesByCategory } from '@/lib/blog-data';
import { getTranslations } from 'next-intl/server';
import type { Article } from '@/types/index';

export default async function DailyNews() {
  const t = await getTranslations('aiNews');
  const articles = await getArticlesByCategory('daily-news');

  // 无文章时整体隐藏
  if (articles.length === 0) return null;

  return (
    <section className="py-8">
      {/* 标题 + 查看全部 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* 脉冲圆点动画 */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <h2 className="text-xl md:text-2xl font-bold">
            {t('dailyTitle')}
          </h2>
        </div>
        <Link href="/daily-news">
          <Button variant="link" className="text-primary hover:text-primary/80 text-sm gap-1">
            {t('viewAll')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 水平滚动卡片容器 */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {articles.slice(0, 8).map((article: Article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
        {/* 右侧渐隐遮罩 */}
        <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

function NewsCard({ article }: { article: Article }) {
  const contentType = article.contentType || 'article';

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      })
    : '';

  // 类型标签：优先显示内容类型，其次分类
  const badgeContent =
    contentType === 'podcast'
      ? '🎙️ 播客'
      : contentType === 'slides'
      ? `📊 ${article.slideCount || 0} 页`
      : article.category?.name;

  return (
    <Link href={`/article/${article.slug}`} className="flex-shrink-0 snap-start">
      <div className="group w-72 md:w-80 p-4 rounded-lg border border-border bg-card hover:bg-card/80 hover:border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
        {/* 类型/分类标签 */}
        {badgeContent && (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary mb-3">
            {badgeContent}
          </span>
        )}

        {/* 标题 */}
        <h3 className="text-sm font-semibold leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* 时间戳 */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{date}</span>
        </div>
      </div>
    </Link>
  );
}
