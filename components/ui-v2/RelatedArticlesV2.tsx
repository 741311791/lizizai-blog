'use client';

/**
 * RelatedArticlesV2 — 相关文章推荐（编辑风升级版，预览组件）
 * RELATED 金色 mono 小标 + 衬线标题；卡片复用已精修的 ArticleCard
 */

import { useTranslations } from 'next-intl';
import ArticleCard from '@/components/article/ArticleCard';
import type { ArticleCardData } from '@/types/index';

interface RelatedArticlesV2Props {
  articles: ArticleCardData[];
}

export default function RelatedArticlesV2({
  articles,
}: RelatedArticlesV2Props) {
  const t = useTranslations('article');

  if (articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-primary">
        Related
      </p>
      <h2 className="mb-8 mt-2.5 font-serif text-2xl font-bold tracking-tight">
        {t('relatedArticles')}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
