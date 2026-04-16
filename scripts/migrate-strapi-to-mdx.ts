/**
 * Strapi → MDX 迁移脚本
 *
 * 用法: STRAPI_URL=http://localhost:1337 npx tsx scripts/migrate-strapi-to-mdx.ts
 *
 * 从 Strapi API 导出所有文章、分类、标签到本地 MDX 文件
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import YAML from 'yaml';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_URL = `${STRAPI_URL}/api`;
const OUTPUT_DIR = path.join(process.cwd(), 'content');

async function fetchAPI(endpoint: string, params: Record<string, string> = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${STRAPI_API_URL}${endpoint}?${queryString}` : `${STRAPI_API_URL}${endpoint}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} - ${await res.text()}`);
  }
  return res.json();
}

async function migrate() {
  console.log('🚀 开始迁移 Strapi → MDX...\n');

  // 1. 获取所有文章
  console.log('📄 获取文章...');
  const articlesData = await fetchAPI('/articles', {
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'pagination[pageSize]': '100',
    'sort': 'publishedAt:desc',
  });

  const articles = Array.isArray(articlesData) ? articlesData : articlesData.data || [];
  console.log(`  找到 ${articles.length} 篇文章\n`);

  // 2. 获取所有分类
  console.log('📂 获取分类...');
  const categoriesData = await fetchAPI('/categories', { 'sort': 'name:asc' });
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData.data || [];
  console.log(`  找到 ${categories.length} 个分类\n`);

  // 3. 获取所有标签
  console.log('🏷️  获取标签...');
  const tagsData = await fetchAPI('/tags', { 'sort': 'name:asc' });
  const tags = Array.isArray(tagsData) ? tagsData : tagsData.data || [];
  console.log(`  找到 ${tags.length} 个标签\n`);

  // 4. 获取所有作者
  console.log('👤 获取作者...');
  const authorsData = await fetchAPI('/authors', { 'populate[avatar]': '*' });
  const authors = Array.isArray(authorsData) ? authorsData : authorsData.data || [];
  console.log(`  找到 ${authors.length} 个作者\n`);

  // 5. 写入 categories.yml
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const categoriesYml = {
    categories: categories.map((cat: any) => ({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
    })),
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'categories.yml'),
    YAML.stringify(categoriesYml)
  );
  console.log('✅ 写入 categories.yml');

  // 6. 写入 tags.yml
  const tagsYml = {
    tags: tags.map((tag: any) => ({ name: tag.name, slug: tag.slug })),
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'tags.yml'),
    YAML.stringify(tagsYml)
  );
  console.log('✅ 写入 tags.yml');

  // 7. 写入作者文件
  const authorsDir = path.join(OUTPUT_DIR, 'authors');
  fs.mkdirSync(authorsDir, { recursive: true });

  for (const author of authors) {
    const authorSlug = author.slug || author.name.toLowerCase().replace(/\s+/g, '-');
    const authorData = {
      name: author.name,
      bio: author.bio || '',
      avatar: author.avatar?.url || '',
      email: author.email || '',
      socialLinks: author.socialLinks || {},
    };
    fs.writeFileSync(
      path.join(authorsDir, `${authorSlug}.yml`),
      YAML.stringify(authorData)
    );
    console.log(`✅ 写入 authors/${authorSlug}.yml`);
  }

  // 8. 写入文章 MDX 文件
  const articlesDir = path.join(OUTPUT_DIR, 'articles');
  fs.mkdirSync(articlesDir, { recursive: true });

  for (const article of articles) {
    const slug = article.slug;
    const articleDir = path.join(articlesDir, slug);
    fs.mkdirSync(articleDir, { recursive: true });

    const frontmatter: Record<string, any> = {
      title: article.title,
      subtitle: article.subtitle || '',
      slug,
      excerpt: article.excerpt || '',
      date: article.publishedAt ? new Date(article.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      author: article.author?.slug || 'zizai-li',
      category: article.category?.slug || 'uncategorized',
      tags: article.tags?.map((t: any) => t.slug) || [],
      readingTime: article.readingTime || 5,
    };

    if (article.featuredImage?.url) {
      frontmatter.coverImage = './cover.jpg';
    }

    const content = article.content || '';
    const mdxContent = matter.stringify(content, frontmatter);

    fs.writeFileSync(path.join(articleDir, 'index.mdx'), mdxContent);
    console.log(`✅ 写入 articles/${slug}/index.mdx`);
  }

  console.log(`\n🎉 迁移完成！共迁移 ${articles.length} 篇文章。`);
  console.log('\n注意：');
  console.log('  - 封面图片需要手动下载到对应文章目录');
  console.log('  - 请检查 frontmatter 字段是否正确');
  console.log('  - likes/views 数据未迁移（由 emaction/Webviso 从零开始）');
}

migrate().catch((error) => {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
});
