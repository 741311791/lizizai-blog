/**
 * 同步逻辑（顺序执行版）
 *
 * 架构：扫描飞书文件夹 → 顺序处理每篇文章 → 写入索引
 * 在 GitHub Actions 或本地 Node.js 环境中运行，无子请求限制
 */

import { FeishuClient, type FeishuFile } from './feishu';
import { convertBlocksToMarkdown, type ImageInfo } from './converter';
import sharp from 'sharp';

// ─── 类型定义 ───

export interface PodcastItemMeta {
  name: string;
  slug: string;
  audioFile: string;
  coverFile?: string;
  scriptFile?: string;
  audioSize: number;
}

export interface SlidesMeta {
  slideCount: number;
  source: 'html_slides';
  hasScreenshots: boolean;
  manifest?: { file: string; label: string }[];
  maxModifiedTime?: number;
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
  coverThumbnail?: string;
  feishuDocToken: string;
  blogFolderToken?: string;
  contentTypes?: {
    article: true;
    podcast?: { items: PodcastItemMeta[] };
    slides?: SlidesMeta;
    html?: { htmlUrl: string; fileSize?: number };
    // 各子内容类型上次同步观测到的最大 modified_time（ISO），
    // 用于多内容类型文件夹的精准增量判断——替代旧的"子文件 mtime > 文章 mtime"基准
    // （后者因播客/PPT 晚于文章生成，mtime 天然偏大，导致增量永久失效）
    syncCheckpoints?: {
      article?: string;
      podcast?: string;
      slides?: string;
      html?: string;
    };
  };
  contentType?: 'article' | 'podcast' | 'slides' | 'html';
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

export interface SyncResult {
  articleCount: number;
  synced: number;    // 实际同步的文章数
  skipped: number;   // 跳过的文章数（未修改）
}

// ─── 飞书子文件夹名称常量 ───

const FOLDER_NAMES = {
  article: ['文章', 'article'],
  podcast: ['播客', 'podcast'],
  slides:  ['PPT', 'ppt'],
  html:    ['html'],
} as const;

function isSubFolder(name: string, aliases: readonly string[]): boolean {
  return aliases.includes(name);
}

/** 飞书子文件夹名 → 内容类型标识 */
function subFolderTypeOf(name: string): 'article' | 'podcast' | 'slides' | 'html' {
  if (isSubFolder(name, FOLDER_NAMES.article)) return 'article';
  if (isSubFolder(name, FOLDER_NAMES.podcast)) return 'podcast';
  if (isSubFolder(name, FOLDER_NAMES.html)) return 'html';
  return 'slides';
}

/** 取文件列表中的最大 modified_time（秒），空列表返回 0 */
export function maxModifiedTime(files: FeishuFile[]): number {
  let max = 0;
  for (const f of files) {
    const t = parseInt(f.modified_time);
    if (t > max) max = t;
  }
  return max;
}

/** 秒级时间戳 → ISO 字符串（0/空 → undefined） */
function toIso(seconds: number): string | undefined {
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : undefined;
}

// ─── 增量判断 ───

/**
 * 判断单文档文章是否需要同步
 * 比较飞书 modified_time 与 R2 meta.json updatedAt
 */
function docNeedsSync(
  file: FeishuFile,
  existingMap: Map<string, ArticleMeta>,
): { needsSync: boolean; cached?: ArticleMeta } {
  const cached = existingMap.get(file.token);
  if (!cached) return { needsSync: true };
  const feishuMs = parseInt(file.modified_time) * 1000;
  const r2Ms = new Date(cached.updatedAt).getTime();
  return { needsSync: feishuMs > r2Ms, cached };
}

/**
 * 深层检测：判断多内容类型文件夹是否需要同步
 *
 * 采用「各内容类型独立高水位」策略：cached.contentTypes.syncCheckpoints 分别
 * 记录文章/播客/PPT 子文件夹上次同步观测到的最大 modified_time，本次只与各自的
 * 高水位比对。任一类型有更新 → 需要同步。
 *
 * 不能用"子文件 mtime > 文章 docx mtime"作基准——多内容类型文章的生产顺序是
 * 先文章后播客/PPT，子文件 mtime 天然大于文章，会导致增量永久失效（每次全量重传）。
 * 返回 subItems 供后续复用，避免重复 listFiles 调用
 */
export async function blogFolderNeedsSync(
  client: FeishuClient,
  blogFolder: FeishuFile,
  existingMap: Map<string, ArticleMeta>,
): Promise<{ needsSync: boolean; cached?: ArticleMeta; subItems?: FeishuFile[] }> {
  const cached = [...existingMap.values()].find(a => a.blogFolderToken === blogFolder.token);
  if (!cached) return { needsSync: true };

  const checkpoints = cached.contentTypes?.syncCheckpoints || {};
  const subItems = await client.listFiles(blogFolder.token);

  const foldersToCheck = subItems.filter(s =>
    s.type === 'folder' && (isSubFolder(s.name, FOLDER_NAMES.article) || isSubFolder(s.name, FOLDER_NAMES.podcast) || isSubFolder(s.name, FOLDER_NAMES.slides) || isSubFolder(s.name, FOLDER_NAMES.html))
  );

  for (const folder of foldersToCheck) {
    const type = subFolderTypeOf(folder.name);
    const files = await client.listFiles(folder.token);
    const currentMax = maxModifiedTime(files);
    const checkpointMs = checkpoints[type] ? new Date(checkpoints[type]!).getTime() : 0;
    if (currentMax * 1000 > checkpointMs) {
      return { needsSync: true, cached, subItems };
    }
  }

  return { needsSync: false, cached };
}

// ─── 工具函数 ───

/**
 * 按文件名前缀分组（去掉扩展名），排除子文件夹
 * 纯函数，便于单元测试
 */
export function groupFilesByBaseName(files: FeishuFile[]): Map<string, FeishuFile[]> {
  const groups = new Map<string, FeishuFile[]>();
  for (const item of files) {
    if (item.type === 'folder') continue;
    const baseName = item.name.replace(/\.[^.]+$/, '');
    if (!groups.has(baseName)) groups.set(baseName, []);
    groups.get(baseName)!.push(item);
  }
  return groups;
}

/** 播客文件匹配结果 */
export interface PodcastFileMatch {
  audioFile: FeishuFile;
  coverFile?: FeishuFile;
  scriptFile?: FeishuFile;
  scriptDoc?: FeishuFile;
}

/**
 * 从一组同名文件中匹配播客所需的音频/封面/文字稿文件
 * 纯函数，便于单元测试
 */
export function matchPodcastFiles(files: FeishuFile[]): PodcastFileMatch | null {
  const audioFile = files.find(f => /\.(mp3|wav|m4a|aac)$/i.test(f.name));
  if (!audioFile) return null;
  const coverFile = files.find(f => /\.(png|jpe?g|webp)$/i.test(f.name));
  const scriptFile = files.find(f => f.type === 'file' && /\.(md|txt)$/i.test(f.name));
  const scriptDoc = files.find(f => f.type === 'docx');
  return { audioFile, coverFile, scriptFile, scriptDoc };
}

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

// ─── 变更追踪 ───

function createTrackedR2(inner: R2Bucket, changes: string[]): R2Bucket {
  return {
    get: (key) => inner.get(key),
    put: (key, value, options) => {
      changes.push(key);
      return inner.put(key, value, options);
    },
    list: (opts) => inner.list(opts),
    delete: (key) => inner.delete(key),
  };
}

// ─── 主流程 ───

/**
 * 执行同步：扫描 → 增量判断 → 仅同步变更文章 → 写入索引
 * 默认增量模式，forceSync=true 时全量同步
 */
export async function performSync(env: SyncEnv, forceSync = false): Promise<SyncResult> {
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

  console.log(`[sync] ${categories.length} 个分类, ${rootDocFiles.length} 个根目录文档 (${forceSync ? '全量' : '增量'})`);

  // 变更追踪（须在 categories 写入前创建，使分类变更也纳入追踪）
  const fileChanges: string[] = [];
  const trackedR2 = createTrackedR2(env.R2, fileChanges);
  const trackedEnv = { ...env, R2: trackedR2 };

  // 2. 保存分类
  await trackedR2.put(`${env.R2_BASE_PATH}/categories.json`, JSON.stringify(categories, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  // 3. 加载已有索引
  const existingIndex = await loadExistingIndex(env.R2, env.R2_BASE_PATH);
  const existingMap = new Map(existingIndex.map(a => [a.feishuDocToken, a]));
  console.log(`[sync] 已缓存 ${existingMap.size} 篇`);

  // 4. 顺序处理每篇文章（含增量判断）
  const allArticles: ArticleMeta[] = [];
  const allDocTokens: string[] = [];
  const allFolderTokens: string[] = [];
  let synced = 0, skipped = 0;

  for (const category of categories) {
    const items = category.slug === 'uncategorized' ? rootDocFiles : await client.listFiles(category.folderToken);
    console.log(`[sync] ${category.name}: ${items.length} 项`);

    for (const item of items) {
      try {
        if (item.type === 'folder') {
          // 多内容类型文件夹：深层增量检测
          let syncSubItems: FeishuFile[] | undefined;
          if (!forceSync) {
            const { needsSync, cached, subItems } = await blogFolderNeedsSync(client, item, existingMap);
            if (!needsSync && cached) {
              console.log(`  [skip] ${item.name} (未修改)`);
              allArticles.push(cached);
              allFolderTokens.push(item.token);
              skipped++;
              continue;
            }
            syncSubItems = subItems;
          }

          // 复用增量检测已获取的 subItems，避免重复 listFiles
          const subItems = syncSubItems || await client.listFiles(item.token);
          const hasArticleFolder = subItems.some(s => s.type === 'folder' && isSubFolder(s.name, FOLDER_NAMES.article));

          if (hasArticleFolder) {
            const article = await syncBlogFolder(client, item, category, trackedEnv);
            if (article) {
              allArticles.push(article);
              allFolderTokens.push(item.token);
              synced++;
            }
          }
        } else if (item.type === 'docx') {
          // 单文档文章（旧格式兼容）：modified_time 增量检测
          if (!forceSync) {
            const { needsSync, cached } = docNeedsSync(item, existingMap);
            if (!needsSync && cached) {
              console.log(`  [skip] ${item.name} (未修改)`);
              allArticles.push(cached);
              allDocTokens.push(item.token);
              skipped++;
              continue;
            }
          }

          const article = await syncDocument(client, item, category, trackedR2, env.R2_BASE_PATH, env.R2_PUBLIC_URL);
          allArticles.push(article);
          allDocTokens.push(item.token);
          synced++;
        }
      } catch (err) {
        console.error(`[sync] 处理失败 ${item.name}:`, err);
      }
    }
  }

  // 5. 写入索引
  await trackedR2.put(`${env.R2_BASE_PATH}/articles.json`, JSON.stringify(allArticles, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  // 6. 清理已删除文章
  try {
    await cleanupDeletedArticles(env.R2, env.R2_BASE_PATH, new Set(allDocTokens), new Set(allFolderTokens), categories);
  } catch (err) {
    console.error('[sync] 清理失败（不影响索引）:', err);
  }

  console.log(`[sync] 同步完成: ${allArticles.length} 篇文章 (同步: ${synced}, 跳过: ${skipped})`);

  // 输出文件变更详情
  if (fileChanges.length > 0) {
    console.log('\n[sync] 文件变更详情:');
    const articleChanges = new Map<string, string[]>();
    const indexChanges: string[] = [];
    for (const key of fileChanges) {
      const match = key.match(/articles\/([^/]+\/[^/]+)\/(.+)$/);
      if (match) {
        if (!articleChanges.has(match[1])) articleChanges.set(match[1], []);
        articleChanges.get(match[1])!.push(match[2]);
      } else {
        indexChanges.push(key.replace(`${env.R2_BASE_PATH}/`, ''));
      }
    }
    for (const f of indexChanges) {
      console.log(`  + ${f}`);
    }
    for (const [articleId, files] of articleChanges) {
      console.log(`  ${articleId}:`);
      for (const f of files) {
        console.log(`    + ${f}`);
      }
    }
  }

  return { articleCount: allArticles.length, synced, skipped };
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
  const htmlFolder    = subItems.find(s => s.type === 'folder' && s.name === 'html');

  if (!articleFolder) {
    console.warn(`  跳过 ${blogFolder.name}：缺少 article 子文件夹`);
    return null;
  }

  // 1. 同步文章（必选）
  const articleFolderItems = await client.listFiles(articleFolder.token);
  const articleDocs = articleFolderItems.filter(f => f.type === 'docx');
  if (articleDocs.length === 0) return null;

  const baseMeta = await syncDocument(client, articleDocs[0], category, env.R2, env.R2_BASE_PATH, env.R2_PUBLIC_URL);

  // 1.5 同步封面图 + 自动生成缩略图
  const coverFile = articleFolderItems.find(f =>
    f.type !== 'folder' && /^cover\.(png|jpe?g|webp|gif)$/i.test(f.name)
  );
  if (coverFile) {
    try {
      const coverData = await client.downloadDriveFile(coverFile.token);
      const coverExt = coverFile.name.split('.').pop()!.toLowerCase();
      const r2ArticleDir = `${env.R2_BASE_PATH}/articles/${category.slug}/${baseMeta.slug}`;

      // 上传原始封面
      const coverR2Path = `${r2ArticleDir}/cover.${coverExt}`;
      await env.R2.put(coverR2Path, coverData, {
        httpMetadata: { contentType: getContentType(coverFile.name) },
      });
      baseMeta.coverImage = `${env.R2_PUBLIC_URL}/${coverR2Path}`;

      // 生成 400px 宽 WebP 缩略图
      const thumbBuffer = await sharp(Buffer.from(coverData))
        .resize(400, 300, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toBuffer();
      const thumbR2Path = `${r2ArticleDir}/cover-thumb.webp`;
      await env.R2.put(thumbR2Path, thumbBuffer, {
        httpMetadata: { contentType: 'image/webp' },
      });
      baseMeta.coverThumbnail = `${env.R2_PUBLIC_URL}/${thumbR2Path}`;

      console.log(`  封面图同步完成: cover.${coverExt} + cover-thumb.webp (${(thumbBuffer.byteLength / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.error(`  封面图同步失败（不影响文章）:`, err);
    }
  }

  // 2. 同步播客（可选，失败不阻塞）
  let podcastResult: { items: PodcastItemMeta[]; maxModifiedTime: number } | undefined;
  if (podcastFolder) {
    try {
      podcastResult = await syncPodcastFolder(client, podcastFolder, baseMeta.slug, category, env.R2, env.R2_BASE_PATH);
      console.log(`  播客同步完成: ${baseMeta.slug}, ${podcastResult.items.length} 个播客`);
    } catch (err) {
      console.error(`  播客同步失败（不影响文章）:`, err);
    }
  }
  const podcastItemsMeta = podcastResult && podcastResult.items.length > 0 ? { items: podcastResult.items } : undefined;
  const podcastCp = podcastResult?.maxModifiedTime ?? 0;

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
  const slidesCp = slidesMeta?.maxModifiedTime ?? 0;

  // 3.5 同步 HTML（可选，失败不阻塞）
  let htmlMeta: { htmlUrl: string; fileSize?: number; maxModifiedTime: number } | undefined;
  if (htmlFolder) {
    try {
      htmlMeta = await syncHtmlFolder(client, htmlFolder, baseMeta.slug, category, env.R2, env.R2_BASE_PATH, env.R2_PUBLIC_URL);
    } catch (err) {
      console.error(`  HTML 同步失败（不影响文章）:`, err);
    }
  }
  const htmlCp = htmlMeta?.maxModifiedTime ?? 0;

  // 4. 组装完整 meta（含各类型同步高水位，供下次精准增量判断）
  const fullMeta: ArticleMeta = {
    ...baseMeta,
    blogFolderToken: blogFolder.token,
    contentTypes: {
      article: true as const,
      podcast: podcastItemsMeta,
      slides: slidesMeta,
      html: htmlMeta ? { htmlUrl: htmlMeta.htmlUrl, fileSize: htmlMeta.fileSize } : undefined,
      syncCheckpoints: {
        article: toIso(maxModifiedTime(articleFolderItems)),
        podcast: podcastFolder ? toIso(podcastCp) : undefined,
        slides: slidesFolder ? toIso(slidesCp) : undefined,
        html: htmlFolder ? toIso(htmlCp) : undefined,
      },
    },
  };

  // 主内容类型优先级：html > slides > podcast（html 为第一阅读类型）
  if (htmlMeta) {
    fullMeta.contentType = 'html';
  } else if (slidesMeta) {
    fullMeta.contentType = 'slides';
    fullMeta.slideCount = slidesMeta.slideCount;
  } else if (podcastItemsMeta) {
    fullMeta.contentType = 'podcast';
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

  let slug = frontmatter?.slug || slugify(docInfo.title);

  // daily-news 分类强制统一 slug 格式：ai-fast-learning-YYYY-MM-DD
  if (category.slug === 'daily-news' && !frontmatter?.slug) {
    const dateMatch = docInfo.title.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      slug = `ai-fast-learning-${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }
  }

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
): Promise<{ items: PodcastItemMeta[]; maxModifiedTime: number }> {
  const items = await client.listFiles(folder.token);

  const groups = groupFilesByBaseName(items);

  if (groups.size === 0) {
    console.log(`  播客文件夹无文件，跳过`);
    return { items: [], maxModifiedTime: 0 };
  }

  const podcastItems: PodcastItemMeta[] = [];
  const r2Prefix = `${r2BasePath}/articles/${category.slug}/${slug}/podcast`;

  for (const [name, files] of groups) {
    const match = matchPodcastFiles(files);
    if (!match) {
      console.log(`  跳过 "${name}"：无音频文件`);
      continue;
    }

    const { audioFile, coverFile, scriptFile, scriptDoc } = match;

    console.log(`  同步播客: ${name} (${audioFile.name})`);

    // 上传音频
    const audioData = await client.downloadDriveFile(audioFile.token);
    await r2.put(`${r2Prefix}/${audioFile.name}`, audioData, {
      httpMetadata: { contentType: getContentType(audioFile.name) },
    });

    // 上传封面
    if (coverFile) {
      try {
        const coverData = await client.downloadDriveFile(coverFile.token);
        await r2.put(`${r2Prefix}/${coverFile.name}`, coverData, {
          httpMetadata: { contentType: getContentType(coverFile.name) },
        });
      } catch (err) {
        console.error(`  封面同步失败 (${coverFile.name}):`, err);
      }
    }

    // 上传文字稿
    let scriptFileName: string | undefined;
    if (scriptDoc) {
      try {
        const blocks = await client.getDocumentBlocks(scriptDoc.token);
        const { markdown } = convertBlocksToMarkdown(blocks, '');
        await r2.put(`${r2Prefix}/${name}.md`, markdown, {
          httpMetadata: { contentType: 'text/markdown' },
        });
        scriptFileName = `${name}.md`;
      } catch (err) {
        console.error(`  逐字稿(docx)同步失败 (${name}):`, err);
      }
    } else if (scriptFile) {
      try {
        const scriptData = await client.downloadDriveFile(scriptFile.token);
        await r2.put(`${r2Prefix}/${name}.md`, scriptData, {
          httpMetadata: { contentType: 'text/markdown' },
        });
        scriptFileName = `${name}.md`;
      } catch (err) {
        console.error(`  逐字稿(file)同步失败 (${name}):`, err);
      }
    }

    podcastItems.push({
      name,
      slug: slugify(name),
      audioFile: audioFile.name,
      coverFile: coverFile?.name,
      scriptFile: scriptFileName,
      audioSize: audioData.byteLength,
    });
  }

  if (podcastItems.length === 0) {
    console.log(`  播客文件夹无有效播客，跳过`);
    return { items: [], maxModifiedTime: maxModifiedTime(items) };
  }

  return { items: podcastItems, maxModifiedTime: maxModifiedTime(items) };
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
    maxModifiedTime: maxModifiedTime(allFiles),
  };
}

/**
 * 同步 HTML 内容类型文件夹
 * 将 html 子目录下的主 .html 文件同步到 R2 articles/{cat}/{slug}/html/index.html，
 * 供前端 HtmlViewer 以 iframe 渲染。产物需符合 lizizai-html 规范
 * （主题 CSS + Google Fonts + postMessage 高度/TOC 同步脚本 + .prose 容器）。
 * 主文件选取优先级：index.html > 与文章 slug 同名 > 唯一/第一个 html 文件。
 */
async function syncHtmlFolder(
  client: FeishuClient,
  folder: FeishuFile,
  slug: string,
  category: CategoryInfo,
  r2: R2Bucket,
  r2BasePath: string,
  r2PublicUrl: string,
): Promise<{ htmlUrl: string; fileSize?: number; maxModifiedTime: number } | undefined> {
  console.log(`  同步 HTML 文件夹...`);

  const allFiles = await client.listAllFilesRecursive(folder.token);
  const htmlFiles = allFiles.filter(f => f.type !== 'folder' && /\.html?$/i.test(f.path));
  if (htmlFiles.length === 0) {
    console.warn(`  HTML 文件夹无 .html 文件，跳过`);
    return undefined;
  }

  // 主文件选取：index.html 优先 → 与 slug 同名 → 唯一/第一个
  const mainFile =
    htmlFiles.find(f => /(^|\/)index\.html?$/i.test(f.path)) ||
    htmlFiles.find(f => f.path.replace(/\.html?$/i, '').endsWith(slug)) ||
    htmlFiles[0];
  if (htmlFiles.length > 1) {
    console.warn(`  HTML 文件夹含 ${htmlFiles.length} 个 html 文件，选用 ${mainFile.path} 作为 index.html`);
  }

  const r2Prefix = `${r2BasePath}/articles/${category.slug}/${slug}/html`;
  const data = await client.downloadDriveFile(mainFile.token);
  await r2.put(`${r2Prefix}/index.html`, data, {
    httpMetadata: { contentType: 'text/html; charset=utf-8' },
  });

  // 辅助资源（自包含 HTML 通常无；若引用了相对路径的图片/字体等，一并同步保留结构）
  const auxFiles = allFiles.filter(f => f.type !== 'folder' && f !== mainFile && !/\.html?$/i.test(f.path));
  for (const file of auxFiles) {
    const auxData = await client.downloadDriveFile(file.token);
    await r2.put(`${r2Prefix}/${file.path}`, auxData, {
      httpMetadata: { contentType: getContentType(file.path) },
    });
  }

  console.log(`  HTML 同步完成: ${mainFile.path} → html/index.html (${(data.byteLength / 1024).toFixed(1)}KB${auxFiles.length ? ` + ${auxFiles.length} 资源` : ''})`);

  return {
    htmlUrl: `${r2PublicUrl}/${r2Prefix}/index.html`,
    fileSize: data.byteLength,
    maxModifiedTime: maxModifiedTime(allFiles),
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
