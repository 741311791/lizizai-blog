import { getAllArticles, getCategories } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';
import {
  generateRSSXml,
  rssResponse,
  matchesContentType,
  FEED_CONTENT_TYPES,
} from '@/lib/rss';
import type { ContentType } from '@/types/index';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params;

  if (!FEED_CONTENT_TYPES.includes(type as ContentType)) {
    return new Response('Invalid content type', { status: 400 });
  }

  const [categories, allArticles] = await Promise.all([
    getCategories(),
    getAllArticles(),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return new Response('Category not found', { status: 404 });
  }

  const filtered = allArticles.filter(
    (a) => matchesContentType(a, type as ContentType) && a.category?.slug === slug
  );

  const xml = generateRSSXml({
    title: `${siteConfig.name} - ${category.name} (${type})`,
    description: category.description || siteConfig.description.en,
    feedPath: `/feed/${type}/${slug}.xml`,
    articles: filtered,
  });
  return rssResponse(xml);
}
