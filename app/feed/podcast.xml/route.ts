// ISR：与文章列表页同频（3600s），紧急更新走 /api/revalidate
export const revalidate = 3600;

import { getAllArticles } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';
import { generateRSSXml, rssResponse, matchesContentType } from '@/lib/rss';

export async function GET() {
  const articles = await getAllArticles();
  const filtered = articles.filter((a) => matchesContentType(a, 'podcast'));
  const xml = generateRSSXml({
    title: `${siteConfig.name} - Podcast`,
    description: siteConfig.description.en,
    feedPath: '/feed/podcast.xml',
    language: 'en',
    articles: filtered,
  });
  return rssResponse(xml);
}
