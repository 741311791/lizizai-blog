// ISR：与文章列表页同频（3600s），紧急更新走 /api/revalidate
export const revalidate = 3600;

import { getArticlesByCategory, getCategories } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';
import { generateRSSXml, rssResponse } from '@/lib/rss';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return new Response('Category not found', { status: 404 });
  }

  const articles = await getArticlesByCategory(slug);
  const xml = generateRSSXml({
    title: `${siteConfig.name} - ${category.name}`,
    description: category.description || siteConfig.description.en,
    feedPath: `/feed/category/${slug}.xml`,
    articles,
  });
  return rssResponse(xml);
}
