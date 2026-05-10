/**
 * 同步逻辑（顺序执行版）
 *
 * 架构：扫描飞书文件夹 → 顺序处理每篇文章 → 写入索引
 * 在 GitHub Actions 或本地 Node.js 环境中运行，无子请求限制
 */

import { FeishuClient, type FeishuFile } from './feishu';
import { convertBlocksToMarkdown, type ImageInfo } from './converter';

// ─── 类型定义 ───

export interface PodcastMeta {
  audioFile: string;
  audioSize: number;
  hasScript: boolean;
  chapters?: { id: string; title: string; startTime: number }[];
  audioDuration?: number;
}

export interface SlidesMeta {
  slideCount: number;
  source: 'html_slides';
  hasScreenshots: boolean;
  manifest?: { file: string; label: string }[];
}

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
  blogFolderToken?: string;
  contentTypes?: {
    article: true;
    podcast?: PodcastMeta;
    slides?: SlidesMeta;
  };
  contentType?: 'article' | 'podcast' | 'slides';
  audioDuration?: number;
  chapters?: { id: string; title: string; startTime: number }[];
  slideCount?: number;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  folderToken: string;
}

export interface R2Bucket {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  put(key: string, value: ArrayBuffer | string, options?: any): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }>;
  delete(key: string): Promise<void>;
}

export interface SyncEnv {
  R2: R2Bucket;
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  FEISHU_FOLDER_TOKEN: string;
  R2_BASE_PATH: string;
  R2_PUBLIC_URL: string;
}

// ─── 工具函数 ───

function calculateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil((chineseChars / 400) + (englishWords / 200)));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    css:  'text/css; charset=utf-8',
    js:   'application/javascript',
    json: 'application/json',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    gif:  'image/gif',
    svg:  'image/svg+xml',
    mp3:  'audio/mpeg',
    wav:  'audio/wav',
    m4a:  'audio/mp4',
    aac:  'audio/aac',
    mp4:  'video/mp4',
    webp: 'image/webp',
  };
  return map[ext || ''] || 'application/octet-stream';
}

function parseDeckManifest(html: string): { file: string; label: string }[] {
  const match = html.match(/window\.DECK_MANIFEST\s*=\s*(\[[\s\S]*?\])/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

async function loadExistingIndex(r2: R2Bucket, r2BasePath: string): Promise<ArticleMeta[]> {
  try {
    const obj = await r2.get(`${r2BasePath}/articles.json`);
    if (!obj) return [];
    return JSON.parse(new TextDecoder().decode(await obj.arrayBuffer()));
  } catch { return []; }
}

// ─── 主流程 ───

/**
 * 执行完整同步：扫描 → 顺序处理每篇文章 → 写入索引
 * 无子请求限制，可在 GitHub Actions 或本地 Node.js 环境中运行
 */
export async function performSync(env: SyncEnv): Promise<{ articleCount: number }> {
  const client = new FeishuClient(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);

  // 1. 扫描根文件夹，生成分类列表
  const rootFiles = await client.listFiles(env.FEISHU_FOLDER_TOKEN);
  const categories: CategoryInfo[] = rootFiles
    .filter(f => f.type === 'folder')
    .map(f => ({ name: f.name, slug: slugify(f.name), description: '', folderToken: f.token }));

  const rootDocFiles = rootFiles.filter(f => f.type === 'docx');
  if (rootDocFiles.length > 0) {
    categories.push({ name: '未分类', slug: 'uncategorized', description: '未分类文章', folderToken: env.FEISHU_FOLDER_TOKEN });
  }

  console.log(`[sync] ${categories.length} 个分类, ${rootDocFiles.length} 个根目录文档`);

  // 2. 保存分类
  await env.R2.put(`${env.R2_BASE_PATH}/categories.json`, JSON.stringify(categories, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  // 3. 增量判断
  const existingIndex = await loadExistingIndex(env.R2, env.R2_BASE_PATH);
  const existingDocTokenMap = new Map(existingIndex.map(a => [a.feishuDocToken, a]));
  console.log(`[sync] 已缓存 ${existingDocTokenMap.size} 篇`);

  // 4. 顺序处理每篇文章
  const allArticles: ArticleMeta[] = [];
  const allDocTokens: string[] = [];
  const allFolderTokens: string[] = [];

  for (const category of categories) {
    const items = category.slug === 'uncategorized' ? rootDocFiles : await client.listFiles(category.folderToken);
    console.log(`[sync] ${category.name}: ${items.length} 项`);

    for (const item of items) {
      try {
        if (item.type === 'folder') {
          // 多内容类型文件夹
          const subItems = await client.listFiles(item.token);
          const hasArticleFolder = subItems.some(s => s.type === 'folder' && (s.name === '文章' || s.name === 'article'));

          if (hasArticleFolder) {
            const article = await syncBlogFolder(client, item, category, env);
            if (article) {
              allArticles.push(article);
              allFolderTokens.push(item.token);
            }
          }
        } else if (item.type === 'docx') {
          // 单文档文章（旧格式兼容）
          const cached = existingDocTokenMap.get(item.token);
          if (cached) {
            allArticles.push(cached);
          } else {
            const article = await syncDocument(client, item, category, env.R2, env.R2_BASE_PATH, env.R2_PUBLIC_URL);
            allArticles.push(article);
          }
          allDocTokens.push(item.token);
        }
      } catch (err) {
        console.error(`[sync] 处理失败 ${item.name}:`, err);
      }
    }
  }

  // 5. 写入索引
  await env.R2.put(`${env.R2_BASE_PATH}/articles.json`, JSON.stringify(allArticles, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  // 6. 清理已删除文章
  try {
    await cleanupDeletedArticles(env.R2, env.R2_BASE_PATH, new Set(allDocTokens), new Set(allFolderTokens), categories);
  } catch (err) {
    console.error('[sync] 清理失败（不影响索引）:', err);
  }

  console.log(`[sync] 同步完成: ${allArticles.length} 篇文章`);
  return { articleCount: allArticles.length };
}

// ─── 文件夹同步 ───

/**
 * 同步多内容类型文件夹（文章 + 播客 + PPT）
 * 顺序执行，播客/PPT 失败不阻塞文章
 */
async function syncBlogFolder(
  client: FeishuClient,
  blogFolder: FeishuFile,
  category: CategoryInfo,
  env: SyncEnv,
): Promise<ArticleMeta | null> {
  console.log(`[sync-blog-folder] 处理: ${blogFolder.name}`);

  const subItems = await client.listFiles(blogFolder.token);
  const articleFolder = subItems.find(s => s.type === 'folder' && (s.name === '文章' || s.name === 'article'));
  const podcastFolder = subItems.find(s => s.type === 'folder' && (s.name === '播客' || s.name === 'podcast'));
  const slidesFolder  = subItems.find(s => s.type === 'folder' && (s.name === 'PPT' || s.name === 'ppt'));

  if (!articleFolder) {
    console.warn(`  跳过 ${blogFolder.name}：缺少 article 子文件夹`);
    return null;
  }

  // 1. 同步文章（必选）
  const articleDocs = (await client.listFiles(articleFolder.token)).filter(f => f.type === 'docx');
  if (articleDocs.length === 0) return null;

  const baseMeta = await syncDocument(client, articleDocs[0], category, env.R2, env.R2_BASE_PATH, env.R2_PUBLIC_URL);

  // 2. 同步播客（可选，失败不阻塞）
  let podcastMeta: PodcastMeta | undefined;
  if (podcastFolder) {
    try {
      podcastMeta = await syncPodcastFolder(client, podcastFolder, baseMeta.slug, category, env.R2, env.R2_BASE_PATH);
      if (podcastMeta) {
        console.log(`  播客同步完成: ${baseMeta.slug}`);
      }
    } catch (err) {
      console.error(`  播客同步失败（不影响文章）:`, err);
    }
  }

  // 3. 同步 PPT（可选，失败不阻塞）
  let slidesMeta: SlidesMeta | undefined;
  if (slidesFolder) {
    try {
      slidesMeta = await syncSlidesFolder(client, slidesFolder, baseMeta.slug, category, env.R2, env.R2_BASE_PATH);
      if (slidesMeta) {
        console.log(`  PPT 同步完成: ${baseMeta.slug}, ${slidesMeta.slideCount} 页`);
      }
    } catch (err) {
      console.error(`  PPT 同步失败（不影响文章）:`, err);
    }
  }

  // 4. 组装完整 meta
  const fullMeta: ArticleMeta = {
    ...baseMeta,
    blogFolderToken: blogFolder.token,
    contentTypes: { article: true as const, podcast: podcastMeta, slides: slidesMeta },
  };

  if (podcastMeta) {
    fullMeta.contentType = 'podcast';
    fullMeta.audioDuration = podcastMeta.audioDuration;
  }
  if (slidesMeta) {
    fullMeta.contentType = 'slides';
    fullMeta.slideCount = slidesMeta.slideCount;
  }

  // 写入最终 meta.json
  await env.R2.put(
    `${env.R2_BASE_PATH}/articles/${category.slug}/${baseMeta.slug}/meta.json`,
    JSON.stringify(fullMeta, null, 2),
    { httpMetadata: { contentType: 'application/json' } },
  );

  return fullMeta;
}

// ─── 核心同步函数 ───

async function syncDocument(
  client: FeishuClient,
  file: FeishuFile,
  category: CategoryInfo,
  r2: R2Bucket,
  r2BasePath: string,
  r2PublicUrl: string,
): Promise<ArticleMeta> {
  console.log(`  Syncing: ${file.name}`);

  const docInfo = await client.getDocumentInfo(file.token);
  const blocks = await client.getDocumentBlocks(file.token);

  const imageBaseUrl = `${r2PublicUrl}/${r2BasePath}/articles/${category.slug}/{slug}/images`;
  const { markdown, images, frontmatter } = convertBlocksToMarkdown(blocks, imageBaseUrl);

  const slug = frontmatter?.slug || slugify(docInfo.title);

  // 下载图片
  const imageDir = `${r2BasePath}/articles/${category.slug}/${slug}/images`;
  const uploadedImages: ImageInfo[] = [];

  for (const img of images) {
    let uploaded = false;
    for (let attempt = 1; attempt <= 3 && !uploaded; attempt++) {
      try {
        const imageData = await client.downloadImage(img.token);
        if (imageData.byteLength === 0) throw new Error('Empty image');

        const bytes = new Uint8Array(imageData);
        let actualExt = 'jpg';
        let contentType = 'image/jpeg';
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          actualExt = 'png'; contentType = 'image/png';
        } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
          actualExt = 'webp'; contentType = 'image/webp';
        } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
          actualExt = 'gif'; contentType = 'image/gif';
        }

        const correctedFilename = img.filename.replace(/\.\w+$/, `.${actualExt}`);
        await r2.put(`${imageDir}/${correctedFilename}`, imageData, { httpMetadata: { contentType } });
        uploadedImages.push({ ...img, filename: correctedFilename });
        uploaded = true;
      } catch (err) {
        console.error(`    图片下载失败 ${img.filename} (${attempt}/3):`, err);
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    if (!uploaded) console.error(`    [FATAL] 图片 ${img.filename} 全部重试失败`);
  }

  let finalMarkdown = markdown.replace(/\{slug\}/g, slug);
  const uploadedMap = new Map(uploadedImages.map(img => [img.token, img]));
  for (const img of images) {
    const uploaded = uploadedMap.get(img.token);
    if (uploaded && uploaded.filename !== img.filename) {
      finalMarkdown = finalMarkdown.replaceAll(img.filename, uploaded.filename);
    }
  }
  const uploadedTokens = new Set(uploadedImages.map(img => img.token));
  for (const img of images) {
    if (!uploadedTokens.has(img.token)) {
      finalMarkdown = finalMarkdown.replace(
        new RegExp(`!\\[${img.filename.replace('.', '\\.')}\\]\\([^)]+\\)`, 'g'),
        `*[图片加载失败: ${img.filename}]*`,
      );
    }
  }

  await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/content.md`, finalMarkdown, {
    httpMetadata: { contentType: 'text/markdown' },
  });

  const contentType = (frontmatter?.contentType as ArticleMeta['contentType']) || 'article';
  const meta: ArticleMeta = {
    slug,
    title: frontmatter?.title || docInfo.title,
    excerpt: frontmatter?.excerpt || finalMarkdown.slice(0, 200).replace(/[#*\[\]\(\)`]/g, ''),
    category: { name: category.name, slug: category.slug },
    tags: (frontmatter?.tags || []).map((t: string) => ({ name: t, slug: slugify(t) })),
    publishedAt: frontmatter?.date || new Date(parseInt(file.created_time) * 1000).toISOString(),
    updatedAt: new Date(parseInt(file.modified_time) * 1000).toISOString(),
    readingTime: calculateReadingTime(finalMarkdown),
    coverImage: undefined,
    feishuDocToken: file.token,
    contentType,
  };

  if (contentType === 'slides' && finalMarkdown.includes('\n---\n')) {
    const slideParts = finalMarkdown.split('\n---\n').filter(Boolean);
    const slidesData = slideParts.map((md, index) => ({ id: `slide-${index}`, index, markdown: md.trim() }));
    meta.slideCount = slidesData.length;
    await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/slides.json`, JSON.stringify(slidesData, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    });
  }

  if (contentType === 'podcast') {
    meta.audioDuration = frontmatter?.audioDuration ? Number(frontmatter.audioDuration) : undefined;
    if (frontmatter?.chapters && Array.isArray(frontmatter.chapters)) {
      meta.chapters = frontmatter.chapters.map((ch: any, i: number) => ({
        id: `chapter-${i}`, title: ch.title || ch, startTime: ch.startTime || ch.time || 0,
      }));
    }
  }

  await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/meta.json`, JSON.stringify(meta, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  console.log(`  Done: ${slug}`);
  return meta;
}

async function syncPodcastFolder(
  client: FeishuClient,
  folder: FeishuFile,
  slug: string,
  category: CategoryInfo,
  r2: R2Bucket,
  r2BasePath: string,
): Promise<PodcastMeta | undefined> {
  const items = await client.listFiles(folder.token);
  const audioFile = items.find(f => /\.(mp3|wav|m4a|aac)$/i.test(f.name));
  const scriptDoc = items.find(f => f.type === 'docx' && !/\.(mp3|wav|m4a|aac)$/i.test(f.name));
  const scriptFile = items.find(f => f.type === 'file' && /\.(md|txt)$/i.test(f.name));

  if (!audioFile) {
    console.log(`  播客文件夹无音频文件，跳过`);
    return undefined;
  }

  console.log(`  同步播客音频: ${audioFile.name}`);
  const audioData = await client.downloadDriveFile(audioFile.token);
  const audioExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
  const contentTypeMap: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac',
  };

  await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/podcast/audio.${audioExt}`, audioData, {
    httpMetadata: { contentType: contentTypeMap[audioExt] || 'audio/mpeg' },
  });

  let hasScript = false;
  if (scriptDoc) {
    try {
      const blocks = await client.getDocumentBlocks(scriptDoc.token);
      const { markdown } = convertBlocksToMarkdown(blocks, '');
      await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/podcast/script.md`, markdown, {
        httpMetadata: { contentType: 'text/markdown' },
      });
      hasScript = true;
    } catch (err) {
      console.error(`  逐字稿(docx)同步失败: ${err}`);
    }
  } else if (scriptFile) {
    try {
      const scriptData = await client.downloadDriveFile(scriptFile.token);
      await r2.put(`${r2BasePath}/articles/${category.slug}/${slug}/podcast/script.md`, scriptData, {
        httpMetadata: { contentType: 'text/markdown' },
      });
      hasScript = true;
    } catch (err) {
      console.error(`  逐字稿(file)同步失败: ${err}`);
    }
  }

  return { audioFile: audioFile.name, audioSize: audioData.byteLength, hasScript };
}

async function syncSlidesFolder(
  client: FeishuClient,
  folder: FeishuFile,
  slug: string,
  category: CategoryInfo,
  r2: R2Bucket,
  r2BasePath: string,
): Promise<SlidesMeta | undefined> {
  console.log(`  同步 PPT 文件夹...`);

  const allFiles = await client.listAllFilesRecursive(folder.token);
  if (allFiles.length === 0) return undefined;

  // 过滤：优先同步核心文件，不再限制总数（GitHub Actions 无子请求限制）
  const coreFiles = allFiles.filter(f =>
    f.path === 'index.html' ||
    /^slides\/\d+-.*\.html$/.test(f.path) ||
    f.path.startsWith('shared/')
  );
  const screenshotFiles = allFiles.filter(f => f.path.startsWith('screenshots/'));
  const otherFiles = allFiles.filter(f =>
    !coreFiles.some(c => c.token === f.token) &&
    !screenshotFiles.some(s => s.token === f.token)
  );

  const filesToSync = [...coreFiles, ...otherFiles, ...screenshotFiles];

  const r2Prefix = `${r2BasePath}/articles/${category.slug}/${slug}/slides`;
  let slideCount = 0;
  let hasScreenshots = filesToSync.some(f => f.path.startsWith('screenshots/'));
  let manifest: { file: string; label: string }[] = [];

  for (const file of filesToSync) {
    const r2Key = `${r2Prefix}/${file.path}`;
    const data = await client.downloadDriveFile(file.token);
    await r2.put(r2Key, data, { httpMetadata: { contentType: getContentType(file.path) } });

    if (/^slides\/\d+-.*\.html$/.test(file.path)) slideCount++;
    if (file.path === 'index.html') {
      manifest = parseDeckManifest(new TextDecoder().decode(data));
    }
  }

  console.log(`  PPT 同步完成: ${slideCount} 页, ${filesToSync.length} 个文件`);
  return {
    slideCount: slideCount || manifest.length,
    source: 'html_slides' as const,
    hasScreenshots,
    manifest: manifest.length > 0 ? manifest : undefined,
  };
}

async function cleanupDeletedArticles(
  r2: R2Bucket,
  r2BasePath: string,
  existingDocTokens: Set<string>,
  existingFolderTokens: Set<string>,
  categories: CategoryInfo[],
): Promise<void> {
  console.log('Cleaning up deleted articles...');
  for (const category of categories) {
    const prefix = `${r2BasePath}/articles/${category.slug}/`;
    const list = await r2.list({ prefix });
    const articleSlugs = new Set<string>();
    for (const obj of list.objects) {
      const match = obj.key.match(new RegExp(`${prefix}([^/]+)/`));
      if (match) articleSlugs.add(match[1]);
    }

    for (const slug of articleSlugs) {
      try {
        const metaObj = await r2.get(`${prefix}${slug}/meta.json`);
        if (!metaObj) continue;
        const meta = JSON.parse(new TextDecoder().decode(await metaObj.arrayBuffer()));
        const shouldDelete = meta.blogFolderToken
          ? !existingFolderTokens.has(meta.blogFolderToken)
          : !existingDocTokens.has(meta.feishuDocToken);
        if (shouldDelete) {
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
