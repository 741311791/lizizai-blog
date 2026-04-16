/**
 * 同步逻辑
 */

import { FeishuClient, type FeishuFile } from './feishu';
import { convertBlocksToMarkdown, type ImageInfo } from './converter';

export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt?: string;
  category: { name: string; slug: string };
  tags?: { name: string; slug: string }[];
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  coverImage?: string;
  feishuDocToken: string;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  folderToken: string;
}

interface R2Bucket {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  put(key: string, value: ArrayBuffer | string, options?: any): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }>;
  delete(key: string): Promise<void>;
}

/**
 * 计算阅读时间（分钟）
 */
function calculateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(w => w.length > 0).length;
  const minutes = (chineseChars / 400) + (englishWords / 200);
  return Math.max(1, Math.ceil(minutes));
}

/**
 * 生成 slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 同步单个文档
 */
async function syncDocument(
  client: FeishuClient,
  file: FeishuFile,
  category: CategoryInfo,
  r2: R2Bucket,
  r2BasePath: string,
  r2PublicUrl: string
): Promise<ArticleMeta> {
  console.log(`Syncing: ${file.name}`);

  // 获取文档信息
  const docInfo = await client.getDocumentInfo(file.token);
  const blocks = await client.getDocumentBlocks(file.token);

  // 转换文档
  const imageBaseUrl = `${r2PublicUrl}/${r2BasePath}/articles/${category.slug}/{slug}/images`;
  const { markdown, images, frontmatter } = convertBlocksToMarkdown(blocks, imageBaseUrl);

  // 确定 slug
  const slug = frontmatter?.slug || slugify(docInfo.title);

  // 下载并上传图片
  const imageDir = `${r2BasePath}/articles/${category.slug}/${slug}/images`;
  for (const img of images) {
    try {
      const imageData = await client.downloadImage(img.token);
      await r2.put(`${imageDir}/${img.filename}`, imageData, {
        httpMetadata: { contentType: img.filename.endsWith('.png') ? 'image/png' : 'image/jpeg' },
      });
      console.log(`  Uploaded image: ${img.filename}`);
    } catch (err) {
      console.error(`  Failed to download image ${img.filename}:`, err);
    }
  }

  // 替换图片 URL 中的 {slug} 占位符
  const finalMarkdown = markdown.replace(/\{slug\}/g, slug);

  // 上传 Markdown 内容
  await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/content.md`, finalMarkdown, {
    httpMetadata: { contentType: 'text/markdown' },
  });

  // 生成元数据
  const meta: ArticleMeta = {
    slug,
    title: frontmatter?.title || docInfo.title,
    excerpt: frontmatter?.excerpt || finalMarkdown.slice(0, 200).replace(/[#*\[\]\(\)`]/g, ''),
    category: { name: category.name, slug: category.slug },
    tags: (frontmatter?.tags || []).map((t: string) => ({ name: t, slug: slugify(t) })),
    publishedAt: frontmatter?.date || new Date(parseInt(file.created_time) * 1000).toISOString(),
    updatedAt: new Date(parseInt(file.modified_time) * 1000).toISOString(),
    readingTime: calculateReadingTime(finalMarkdown),
    coverImage: images.length > 0 ? `${r2PublicUrl}/${imageDir}/${images[0].filename}` : undefined,
    feishuDocToken: file.token,
  };

  // 上传元数据
  await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/meta.json`, JSON.stringify(meta, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  console.log(`  Done: ${slug}`);
  return meta;
}

/**
 * 清理已删除的文章
 */
async function cleanupDeletedArticles(
  r2: R2Bucket,
  r2BasePath: string,
  existingTokens: Set<string>,
  categories: CategoryInfo[]
): Promise<void> {
  console.log('Cleaning up deleted articles...');

  for (const category of categories) {
    const prefix = `${r2BasePath}/articles/${category.slug}/`;
    const list = await r2.list({ prefix });

    // 提取所有文章的 slug
    const articleSlugs = new Set<string>();
    for (const obj of list.objects) {
      const match = obj.key.match(new RegExp(`${prefix}([^/]+)/`));
      if (match) articleSlugs.add(match[1]);
    }

    // 读取每个文章的 meta.json，检查 feishuDocToken 是否还存在
    for (const slug of articleSlugs) {
      try {
        const metaObj = await r2.get(`${prefix}${slug}/meta.json`);
        if (!metaObj) continue;

        const meta = JSON.parse(new TextDecoder().decode(await metaObj.arrayBuffer()));
        if (!existingTokens.has(meta.feishuDocToken)) {
          // 删除该文章的所有文件
          const articlePrefix = `${prefix}${slug}/`;
          const articleFiles = await r2.list({ prefix: articlePrefix });
          for (const file of articleFiles.objects) {
            await r2.delete(file.key);
          }
          console.log(`  Deleted: ${category.slug}/${slug}`);
        }
      } catch (err) {
        console.error(`  Error checking ${slug}:`, err);
      }
    }
  }
}

/**
 * 主同步流程
 */
export async function performSync(
  env: {
    R2: R2Bucket;
    FEISHU_APP_ID: string;
    FEISHU_APP_SECRET: string;
    FEISHU_FOLDER_TOKEN: string;
    R2_BASE_PATH: string;
    R2_PUBLIC_URL: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const client = new FeishuClient(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);

    // 1. 扫描根文件夹，获取分类（子文件夹）和根目录下的直接文档
    console.log('Scanning root folder...');
    const rootFiles = await client.listFiles(env.FEISHU_FOLDER_TOKEN);

    // 子文件夹作为分类
    const categories: CategoryInfo[] = rootFiles
      .filter(f => f.type === 'folder')
      .map(f => ({
        name: f.name,
        slug: slugify(f.name),
        description: '',
        folderToken: f.token,
      }));

    // 根目录下直接的 docx 文件，归入「未分类」
    const rootDocFiles = rootFiles.filter(f => f.type === 'docx');
    if (rootDocFiles.length > 0) {
      const defaultCategory: CategoryInfo = {
        name: '未分类',
        slug: 'uncategorized',
        description: '未分类文章',
        folderToken: env.FEISHU_FOLDER_TOKEN,
      };
      categories.push(defaultCategory);
    }

    console.log(`Found ${categories.length} categories:`, categories.map(c => c.name).join(', '));
    console.log(`Found ${rootDocFiles.length} root-level documents`);

    // 保存分类配置到 R2
    await env.R2.put(`${env.R2_BASE_PATH}/categories.json`, JSON.stringify(categories, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    });

    // 2. 同步每个分类下的文档
    const allArticles: ArticleMeta[] = [];
    const allDocTokens = new Set<string>();

    for (const category of categories) {
      console.log(`\nSyncing category: ${category.name}`);
      // 如果是「未分类」分类，使用根目录下已扫描的文档
      const files = category.slug === 'uncategorized'
        ? rootDocFiles
        : (await client.listFiles(category.folderToken)).filter(f => f.type === 'docx');

      console.log(`  Found ${files.length} documents`);

      for (const file of files) {
        try {
          const article = await syncDocument(
            client,
            file,
            category,
            env.R2,
            env.R2_BASE_PATH,
            env.R2_PUBLIC_URL
          );
          allArticles.push(article);
          allDocTokens.add(file.token);
        } catch (err) {
          console.error(`Failed to sync ${file.name}:`, err);
        }
      }
    }

    // 3. 生成全量文章索引
    console.log('\nGenerating articles index...');
    await env.R2.put(`${env.R2_BASE_PATH}/articles.json`, JSON.stringify(allArticles, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    });

    // 4. 清理已删除的文章
    await cleanupDeletedArticles(env.R2, env.R2_BASE_PATH, allDocTokens, categories);

    console.log(`\nSync complete: ${allArticles.length} articles`);
    return { success: true, message: `Synced ${allArticles.length} articles` };
  } catch (err) {
    console.error('Sync failed:', err);
    return { success: false, message: String(err) };
  }
}
