import Link from 'next/link';
import { getArticlesByTag, getAllTagSlugs, getAllTags } from '@/lib/blog-data';
import ArticleGrid from '@/components/article/ArticleGrid';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllTagSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tags = await getAllTags();
  const tag = tags.find(t => t.slug === slug);
  return {
    title: `${tag?.name || slug} - Zizai Blog`,
    description: `浏览所有「${tag?.name || slug}」标签下的文章`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [articles, allTags] = await Promise.all([
    getArticlesByTag(slug),
    getAllTags(),
  ]);
  const tagName = allTags.find(t => t.slug === slug)?.name || slug;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* 返回链接 */}
      <Link
        href="/archive"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回归档
      </Link>

      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          #{tagName}
        </h1>
        <p className="text-muted-foreground">
          共 {articles.length} 篇文章
        </p>
      </div>

      {/* 文章列表 */}
      {articles.length > 0 ? (
        <ArticleGrid articles={articles} variant="default" />
      ) : (
        <p className="text-center text-muted-foreground py-12">
          暂无该标签下的文章
        </p>
      )}

      {/* 相关标签 */}
      {allTags.length > 1 && (
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold mb-4">其他标签</h2>
          <div className="flex flex-wrap gap-2">
            {allTags
              .filter(t => t.slug !== slug)
              .map(tag => (
                <Link key={tag.slug} href={`/tag/${tag.slug}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamicParams = true;
