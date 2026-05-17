import { getAllArticles } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';
import { generateRSSXml, rssResponse, matchesContentType } from '@/lib/rss';

export async function GET() {
  const articles = await getAllArticles();
  const filtered = articles.filter((a) => matchesContentType(a, 'article'));
  const xml = generateRSSXml({
    title: `${siteConfig.name} - Articles`,
    description: siteConfig.description.en,
    feedPath: '/feed/article.xml',
    language: 'en',
    articles: filtered,
  });
  return rssResponse(xml);
}
