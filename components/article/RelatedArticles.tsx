'use client';

import { useTranslations } from 'next-intl';
import ArticleCard from './ArticleCard';
import type { Article } from '@/types/index';

interface RelatedArticlesProps {
  articles: Article[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  const t = useTranslations('article');

  if (articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="text-2xl font-bold mb-8">{t('relatedArticles')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
