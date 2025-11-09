/**
 * ArticleGrid - 文章网格布局共享组件
 *
 * 提供统一的文章卡片网格布局，支持响应式和自定义列数
 */

import ArticleCard from './ArticleCard';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  featuredImage?: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  likes: number;
  commentsCount?: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface ArticleGridProps {
  articles: Article[];
  /**
   * 列数配置，默认为 'default' (1列 -> 2列 -> 3列)
   * - 'default': grid-cols-1 md:grid-cols-2 lg:grid-cols-3
   * - 'compact': grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
   * - 'wide': grid-cols-1 lg:grid-cols-2
   */
  variant?: 'default' | 'compact' | 'wide';
  /**
   * 自定义类名
   */
  className?: string;
}

export default function ArticleGrid({
  articles,
  variant = 'default',
  className = ''
}: ArticleGridProps) {
  // 根据变体选择网格类名
  const gridClasses = {
    default: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    compact: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    wide: 'grid-cols-1 lg:grid-cols-2',
  };

  return (
    <div className={`grid ${gridClasses[variant]} gap-6 ${className}`}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
