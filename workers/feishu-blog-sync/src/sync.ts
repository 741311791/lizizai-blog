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

  // 下载并上传图片（带重试）
  const imageDir = `${r2BasePath}/articles/${category.slug}/${slug}/images`;
  const uploadedImages: ImageInfo[] = [];

  for (const img of images) {
    let uploaded = false;
    for (let attempt = 1; attempt <= 3 && !uploaded; attempt++) {
      try {
        const imageData = await client.downloadImage(img.token);
        if (imageData.byteLength === 0) {
          throw new Error('Downloaded image is empty (0 bytes)');
        }

        // 根据实际数据 magic bytes 检测图片格式，修正文件名和 Content-Type
        const bytes = new Uint8Array(imageData);
        let actualExt = 'jpg';
        let contentType = 'image/jpeg';
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          actualExt = 'png';
          contentType = 'image/png';
        } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
          actualExt = 'webp';
          contentType = 'image/webp';
        } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
          actualExt = 'gif';
          contentType = 'image/gif';
        }

        // 如果扩展名与实际格式不匹配，修正文件名
        const correctedFilename = img.filename.replace(/\.\w+$/, `.${actualExt}`);

        await r2.put(`${imageDir}/${correctedFilename}`, imageData, {
          httpMetadata: { contentType },
        });
        console.log(`  Uploaded image: ${correctedFilename} (${imageData.byteLength} bytes, ${contentType})`);

        // 用修正后的文件名记录
        uploadedImages.push({ ...img, filename: correctedFilename });
        uploaded = true;
      } catch (err) {
        console.error(`  Failed to download image ${img.filename} (attempt ${attempt}/3):`, err);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (!uploaded) {
      console.error(`  [FATAL] Image ${img.filename} (${img.token}) failed all 3 attempts`);
    }
  }

  // 替换图片 URL 中的 {slug} 占位符
  let finalMarkdown = markdown.replace(/\{slug\}/g, slug);

  // 修正 markdown 中因格式检测而改名的图片引用
  const uploadedMap = new Map(uploadedImages.map(img => [img.token, img]));
  for (const img of images) {
    const uploaded = uploadedMap.get(img.token);
    if (uploaded && uploaded.filename !== img.filename) {
      // 文件名被修正了，更新 markdown 中的引用
      finalMarkdown = finalMarkdown.replaceAll(img.filename, uploaded.filename);
    }
  }

  // 移除上传失败的图片引用，替换为占位文本
  const uploadedTokens = new Set(uploadedImages.map(img => img.token));
  for (const img of images) {
    if (!uploadedTokens.has(img.token)) {
      finalMarkdown = finalMarkdown.replace(
        new RegExp(`!\\[${img.filename.replace('.', '\\.')}\\]\\([^)]+\\)`, 'g'),
        `*[图片加载失败: ${img.filename}]*`
      );
    }
  }

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
    coverImage: undefined, // 封面图统一使用 picsum.photos，不从文章内容提取
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
