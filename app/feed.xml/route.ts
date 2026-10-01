// ISR：与文章列表页同频（3600s），紧急更新走 /api/revalidate
export const revalidate = 3600;

import { getAllArticles } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';
import { generateRSSXml, rssResponse } from '@/lib/rss';

export async function GET() {
  const articles = await getAllArticles();
  const xml = generateRSSXml({
    title: siteConfig.name,
    description: siteConfig.description.zh,
    feedPath: '/feed.xml',
    articles,
  });
  return rssResponse(xml);
}
