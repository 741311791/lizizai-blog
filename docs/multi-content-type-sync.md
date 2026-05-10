# 博客多内容类型同步架构升级

> 日期：2026-05-05
> 状态：全部阶段已完成 ✅（阶段一 Worker 同步 + 阶段二 前端数据层 + 阶段三 前端组件 + 阶段四 R2 CORS）

## 1. 背景与目标

### 现状

当前每篇博客在飞书中是**单个文档**，Worker 同步时逐文档处理，R2 存储为扁平路径：

```
飞书：分类文件夹 → 若干 docx 文档
R2：  articles/{cat}/{slug}/content.md
      articles/{cat}/{slug}/meta.json
      articles/{cat}/{slug}/images/*
```

播客和 PPT 的内容类型（`contentType`）仅通过 frontmatter 元数据区分，实际并无独立的音频/幻灯片数据源。

### 目标

每篇博客升级为**文件夹结构**，包含三种内容形式：

| 类型 | 飞书源 | R2 目标 | 处理方式 |
|------|--------|---------|----------|
| 文章 | 飞书文档 (.docx) | `content.md` + `images/` | 现有 Markdown 转换逻辑 |
| 播客 | 音频文件 + 逐字稿文档 | `podcast/audio.mp3` + `podcast/script.md` | 文件直传 + Markdown 转换 |
| PPT | HTML 文件夹（index.html + slides/ + shared/ + screenshots/） | `slides/*`（完整文件树） | 原样同步，无转换 |

### 飞书目录结构（已创建）

```
Daily News/                                    ← 分类
  {article_name}/                ← 文章文件夹（一篇 = 一个文件夹）
    article/
    │   └── {article_name}        ← 飞书文档（必填）
    │   └── cover.png             ← 封面图片（选填）
    podcast/
    │   ├── podcast.mp3              ← 音频（可选）
    │   └── podcast_script.md        ← 逐字稿文档（可选）
    ppt/
        ├── index.html                         ← HTML 播放器
        ├── slides/                            ← 各页 HTML
        ├── shared/                            ← 共享 CSS
        └── screenshots/                       ← 预渲染截图
```

## 2. R2 存储设计

### 新路径结构

```
blog-data/articles/{category}/{slug}/
├── meta.json                 ← 元数据（扩展 contentTypes 字段）
├── content.md                ← 文章 Markdown（路径不变，兼容旧数据）
├── images/                   ← 封面图片
├── podcast/                  ← 🆕 播客内容
│   ├── audio.mp3
│   └── script.md
└── slides/                   ← 🆕 HTML 幻灯片（完整文件树）
    ├── index.html
    ├── slides/
    │   ├── 01-cover.html
    │   └── ...
    ├── shared/
    │   └── tokens.css
    └── screenshots/
        ├── 01-cover.png
        └── ...
```

**设计决策：文章路径不变**。`content.md`、`images/`、`meta.json` 保持原位，新增 `podcast/` 和 `slides/` 子目录。原因：
- 现有文章无需迁移，新旧结构可共存
- 前端 `getArticleContent()` 无需修改
- 清理逻辑最小变更

### meta.json 新字段

```typescript
// Worker 端 ArticleMeta 扩展
interface ArticleMeta {
  // ... 现有字段全部保留 ...

  /** 多内容类型可用性（新增） */
  contentTypes?: {
    article: true;                    // 始终 true
    podcast?: {
      audioFile: string;              // 音频文件名
      audioSize: number;              // 文件大小 (bytes)
      hasScript: boolean;             // 是否有逐字稿
      chapters?: Chapter[];
      audioDuration?: number;         // 时长（秒）
    };
    slides?: {
      slideCount: number;
      source: 'html_slides';          // HTML 幻灯片
      hasScreenshots: boolean;
      manifest?: { file: string; label: string }[];  // 从 index.html 提取
    };
  };

  // ⚠️ 以下旧字段保留兼容，Worker 同步时同时写入新旧字段
  contentType?: 'article' | 'podcast' | 'slides';
  audioDuration?: number;
  chapters?: { id: string; title: string; startTime: number }[];
  slideCount?: number;
}
```

### articles.json 索引变化

索引中每条记录的 `contentTypes` 字段标识该文章可用的内容形式。前端据此动态显示 ContentTypeSwitcher 按钮。

---

## 3. 实施任务分解

### 阶段一：Worker 同步逻辑改造

#### 任务 1.1：扩展飞书客户端（feishu.ts）

**文件**：`workers/feishu-blog-sync/src/feishu.ts`

**新增方法**：

```typescript
/**
 * 下载云盘中的任意文件（音频、HTML、CSS 等）
 * 使用 drive/v1/files/{file_token} 端点
 */
async downloadDriveFile(fileToken: string): Promise<ArrayBuffer>

/**
 * 递归列出文件夹下所有文件（含子文件夹）
 * 返回带相对路径的文件列表，用于 PPT 文件夹同步
 */
async listAllFilesRecursive(
  folderToken: string,
  basePath?: string
): Promise<Array<FeishuFile & { path: string }>>
```

**涉及的飞书 API**：

| 功能 | 端点 | 说明 |
|------|------|------|
| 列出文件夹内容 | `GET /drive/v1/files` | 现有 `listFiles()` 已实现 |
| 下载云盘文件 | `GET /drive/v1/files/{token}` | 新增，需处理 302 重定向 |
| 文件元数据 | `GET /open.lark/drive/file/{token}` | 可选，获取文件大小 |

**注意**：飞书云盘文件下载 API 返回 302 重定向到 OSS，需要 `redirect: 'follow'` 或手动跟随 Location header。

#### 任务 1.2：Worker 主同步逻辑改造（sync.ts）

**文件**：`workers/feishu-blog-sync/src/sync.ts`

**核心变更**：`performSync()` 中分类遍历逻辑增加文件夹/文档分流。

**伪代码**：

```typescript
// performSync() 内部，遍历每个分类时：
for (const category of categories) {
  const items = await client.listFiles(category.folderToken);

  for (const item of items) {
    if (item.type === 'folder') {
      // 🆕 新逻辑：文件夹 = 多内容类型博客
      // 检查是否为"博客文件夹"（含"文章"子文件夹）
      const subItems = await client.listFiles(item.token);
      const hasArticleFolder = subItems.some(
        s => s.name === '文章' && s.type === 'folder'
      );

      if (hasArticleFolder) {
        const article = await syncBlogFolder(client, item, category, env);
        if (article) {
          allArticles.push(article);
          allDocTokens.add(article.feishuDocToken);
        }
      }
      // 否则忽略（可能是其他用途的文件夹）

    } else if (item.type === 'docx') {
      // 📦 旧逻辑：直接文档 = 单内容类型文章（兼容）
      const article = await syncDocument(client, item, category, ...);
      allArticles.push(article);
      allDocTokens.add(item.token);
    }
  }
}
```

#### 任务 1.3：新增 syncBlogFolder 函数

**文件**：`workers/feishu-blog-sync/src/sync.ts`

```typescript
/**
 * 同步博客文件夹（新架构：一文件夹 = 一篇博客，含文章/播客/PPT）
 */
async function syncBlogFolder(
  client: FeishuClient,
  blogFolder: FeishuFile,
  category: CategoryInfo,
  env: SyncEnv
): Promise<ArticleMeta | null> {
  const subItems = await client.listFiles(blogFolder.token);

  // 查找三个子文件夹（固定命名）
  const articleFolder = subItems.find(s => s.name === '文章' && s.type === 'folder');
  const podcastFolder = subItems.find(s => s.name === '播客' && s.type === 'folder');
  const slidesFolder  = subItems.find(s => s.name === 'PPT'   && s.type === 'folder');

  if (!articleFolder) {
    console.warn(`跳过 ${blogFolder.name}：缺少"文章"子文件夹`);
    return null;
  }

  // ── 1. 同步文章内容（必选） ──
  // "文章"文件夹下取第一个 docx 文档
  const articleDocs = (await client.listFiles(articleFolder.token))
    .filter(f => f.type === 'docx');

  if (articleDocs.length === 0) {
    console.warn(`跳过 ${blogFolder.name}："文章"子文件夹为空`);
    return null;
  }

  const docFile = articleDocs[0];
  const baseMeta = await syncDocument(client, docFile, category, env.R2, env.R2_BASE_PATH, env.R2_PUBLIC_URL);
  // syncDocument 上传 content.md 到旧路径，保持兼容

  // ── 2. 同步播客内容（可选） ──
  const podcastMeta = podcastFolder
    ? await syncPodcastFolder(client, podcastFolder, baseMeta.slug, category, env)
    : undefined;

  // ── 3. 同步 PPT 内容（可选） ──
  const slidesMeta = slidesFolder
    ? await syncSlidesFolder(client, slidesFolder, baseMeta.slug, category, env)
    : undefined;

  // ── 4. 更新 meta.json，追加 contentTypes ──
  const fullMeta: ArticleMeta = {
    ...baseMeta,
    contentTypes: {
      article: true as const,
      podcast: podcastMeta,
      slides: slidesMeta,
    },
  };

  // 向后兼容：如果有播客数据，也写旧字段
  if (podcastMeta) {
    fullMeta.contentType = 'podcast';
    fullMeta.audioDuration = podcastMeta.audioDuration;
    fullMeta.chapters = podcastMeta.chapters;
  }
  if (slidesMeta) {
    fullMeta.contentType = 'slides';
    fullMeta.slideCount = slidesMeta.slideCount;
  }

  await env.R2.put(
    `${env.R2_BASE_PATH}/articles/${category.slug}/${baseMeta.slug}/meta.json`,
    JSON.stringify(fullMeta, null, 2),
    { httpMetadata: { contentType: 'application/json' } }
  );

  return fullMeta;
}
```

#### 任务 1.4：新增 syncPodcastFolder 函数

**文件**：`workers/feishu-blog-sync/src/sync.ts`

```typescript
/**
 * 同步播客文件夹
 * 期望内容：音频文件 (.mp3/.wav/.m4a) + 可选逐字稿文档 (.docx)
 */
async function syncPodcastFolder(
  client: FeishuClient,
  folder: FeishuFile,
  slug: string,
  category: CategoryInfo,
  env: SyncEnv
): Promise<PodcastMeta | undefined> {
  const items = await client.listFiles(folder.token);

  // 查找音频文件
  const audioFile = items.find(f =>
    /\.(mp3|wav|m4a|aac)$/i.test(f.name) && f.type !== 'docx'
  );

  // 查找逐字稿文档
  const scriptDoc = items.find(f =>
    f.type === 'docx' && !/\.(mp3|wav|m4a|aac)$/i.test(f.name)
  );

  if (!audioFile) {
    console.log(`  播客文件夹无音频文件，跳过`);
    return undefined;
  }

  // 下载音频并上传到 R2
  console.log(`  同步播客音频: ${audioFile.name}`);
  const audioData = await client.downloadDriveFile(audioFile.token);
  const audioExt = audioFile.name.split('.').pop() || 'mp3';
  const r2AudioKey = `${env.R2_BASE_PATH}/articles/${category.slug}/${slug}/podcast/audio.${audioExt}`;

  await env.R2.put(r2AudioKey, audioData, {
    httpMetadata: { contentType: `audio/${audioExt === 'mp3' ? 'mpeg' : audioExt}` },
  });

  // 转换逐字稿（如有）
  let hasScript = false;
  if (scriptDoc) {
    console.log(`  同步播客逐字稿: ${scriptDoc.name}`);
    const docInfo = await client.getDocumentInfo(scriptDoc.token);
    const blocks = await client.getDocumentBlocks(scriptDoc.token);
    const { markdown } = convertBlocksToMarkdown(blocks, '');
    const r2ScriptKey = `${env.R2_BASE_PATH}/articles/${category.slug}/${slug}/podcast/script.md`;

    await env.R2.put(r2ScriptKey, markdown, {
      httpMetadata: { contentType: 'text/markdown' },
    });
    hasScript = true;
  }

  return {
    audioFile: audioFile.name,
    audioSize: audioData.byteLength,
    hasScript,
  };
}
```

#### 任务 1.5：新增 syncSlidesFolder 函数

**文件**：`workers/feishu-blog-sync/src/sync.ts`

```typescript
/**
 * 同步 HTML 幻灯片文件夹
 * 将完整文件树原样上传到 R2，保持相对路径结构
 */
async function syncSlidesFolder(
  client: FeishuClient,
  folder: FeishuFile,
  slug: string,
  category: CategoryInfo,
  env: SyncEnv
): Promise<SlidesMeta | undefined> {
  console.log(`  同步 PPT 文件夹...`);

  // 递归获取所有文件
  const allFiles = await client.listAllFilesRecursive(folder.token);

  if (allFiles.length === 0) {
    console.log(`  PPT 文件夹为空，跳过`);
    return undefined;
  }

  const r2Prefix = `${env.R2_BASE_PATH}/articles/${category.slug}/${slug}/slides`;
  let slideCount = 0;
  let hasScreenshots = false;
  let manifest: { file: string; label: string }[] = [];

  for (const file of allFiles) {
    const r2Key = `${r2Prefix}/${file.path}`;
    const data = await client.downloadDriveFile(file.token);

    await env.R2.put(r2Key, data, {
      httpMetadata: { contentType: getContentType(file.path) },
    });

    // 统计
    if (/^slides\/\d+-.*\.html$/.test(file.path)) slideCount++;
    if (file.path.startsWith('screenshots/')) hasScreenshots = true;

    // 从 index.html 提取 manifest
    if (file.path === 'index.html') {
      manifest = parseDeckManifest(new TextDecoder().decode(data));
    }
  }

  console.log(`  PPT 同步完成: ${slideCount} 页, ${allFiles.length} 个文件`);

  return {
    slideCount: slideCount || manifest.length,
    source: 'html_slides' as const,
    hasScreenshots,
    manifest: manifest.length > 0 ? manifest : undefined,
  };
}

/** 从 index.html 提取 DECK_MANIFEST */
function parseDeckManifest(html: string): { file: string; label: string }[] {
  const match = html.match(/window\.DECK_MANIFEST\s*=\s*(\[[\s\S]*?\])/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

/** 根据文件扩展名返回 Content-Type */
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
    mp4:  'video/mp4',
    webp: 'image/webp',
  };
  return map[ext || ''] || 'application/octet-stream';
}
```

#### 任务 1.6：清理逻辑适配

**文件**：`workers/feishu-blog-sync/src/sync.ts`

现有 `cleanupDeletedArticles()` 通过 `feishuDocToken` 判断是否删除。新架构下，博客文件夹的 token 不是文档 token，需要额外跟踪。

**方案**：在 `performSync()` 中同时收集文件夹 token，清理时对比。

```typescript
// performSync 中新增
const allFolderTokens = new Set<string>(); // 博客文件夹 token

// syncBlogFolder 中
allDocTokens.add(baseMeta.feishuDocToken);  // 文章文档 token（旧兼容）
allFolderTokens.add(blogFolder.token);       // 文件夹 token（新）

// cleanupDeletedArticles 中
// 如果 meta.json 有 blogFolderToken 字段，对比 folderTokens
// 否则走旧的 feishuDocToken 对比
```

需要在 `ArticleMeta` 中新增 `blogFolderToken?: string` 字段。

---

### 阶段二：前端数据层改造

#### 任务 2.1：类型定义扩展

**文件**：`types/index.ts`

```typescript
/** 文章可用的内容类型描述 */
export interface ContentTypes {
  article: true;
  podcast?: {
    audioFile: string;
    hasScript: boolean;
    chapters?: Chapter[];
    audioDuration?: number;
  };
  slides?: {
    slideCount: number;
    source: 'html_slides';
    hasScreenshots: boolean;
    manifest?: { file: string; label: string }[];
  };
}

// Article 类型新增字段
export interface Article {
  // ... 现有字段不变 ...

  /** 可用内容类型（来自 R2 meta.json） */
  contentTypes?: ContentTypes;

  /** HTML 幻灯片基础 URL（前端拼接） */
  slidesBaseUrl?: string;
}
```

#### 任务 2.2：数据获取层改造

**文件**：`lib/blog-data.ts`

**变更点**：

1. `getAllArticles()` — 解析 `contentTypes` 字段
2. `getArticleBySlug()` — 根据 `contentTypes` 加载播客/PPT 数据
3. 新增 `getPodcastContent()` 和 `getSlidesContent()` 函数
4. 新增 `getHtmlSlidesUrl()` 构造 PPT iframe 地址

```typescript
// getAllArticles() 中映射新字段
contentTypes: item.contentTypes,
slidesBaseUrl: item.contentTypes?.slides
  ? `${R2_BASE}/blog-data/articles/${item.category?.slug || 'uncategorized'}/${item.slug}/slides`
  : undefined,

// getArticleBySlug() 中
if (article.contentTypes?.podcast) {
  const cat = article.category.slug;
  result.audioUrl = `${R2_BASE}/blog-data/articles/${cat}/${slug}/podcast/audio.mp3`;
  if (article.contentTypes.podcast.hasScript) {
    result.scriptContent = await getPodcastScript(cat, slug);
  }
}

if (article.contentTypes?.slides) {
  // HTML 幻灯片：直接构造 URL，不需要预加载
  result.slidesBaseUrl = `${R2_BASE}/blog-data/articles/${cat}/${slug}/slides`;
  result.slideCount = article.contentTypes.slides.slideCount;
}
```

**R2 路径变更汇总**：

| 数据 | 旧路径 | 新路径 | 说明 |
|------|--------|--------|------|
| 文章内容 | `articles/{cat}/{slug}/content.md` | **不变** | 兼容 |
| 文章图片 | `articles/{cat}/{slug}/images/` | **不变** | 兼容 |
| 播客音频 | `articles/{cat}/{slug}/audio.mp3` | `articles/{cat}/{slug}/podcast/audio.mp3` | 新子目录 |
| 播客逐字稿 | `articles/{cat}/{slug}/script.md` | `articles/{cat}/{slug}/podcast/script.md` | 新子目录 |
| PPT | `articles/{cat}/{slug}/slides.json` | `articles/{cat}/{slug}/slides/index.html` | 全新 |

---

### 阶段三：前端组件改造

#### 任务 3.1：ContentTypeSwitcher 动态化

**文件**：`components/article/ContentTypeSwitcher.tsx`

**变更**：根据 `contentTypes` 动态显示按钮，而非始终显示三个。

```typescript
interface ContentTypeSwitcherProps {
  contentTypes: ContentTypes;    // 替代 activeType
  activeType: string;
  onTypeChange: (type: string) => void;
}

// 渲染逻辑
const options = [
  { key: 'article', ... },  // 始终显示
  contentTypes.podcast ? { key: 'podcast', ... } : null,
  contentTypes.slides  ? { key: 'slides', ... }  : null,
].filter(Boolean);
```

#### 任务 3.2：SlideViewer 支持 HTML 模式

**文件**：`components/article/SlideViewer.tsx`

**变更**：新增 `mode: 'markdown' | 'html'` 区分两种幻灯片来源。

- `mode === 'markdown'`：现有逻辑（ReactMarkdown 渲染）
- `mode === 'html'`：iframe 嵌入 R2 上的 index.html

```typescript
interface SlideViewerProps {
  mode: 'markdown' | 'html';
  // markdown 模式参数
  slides?: SlideData[];
  currentIndex?: number;
  onSlideChange?: (index: number) => void;
  // html 模式参数
  slidesBaseUrl?: string;
  manifest?: { file: string; label: string }[];
  screenshotsBaseUrl?: string;
}
```

HTML 模式渲染：

```tsx
{mode === 'html' && slidesBaseUrl && (
  <div className="relative w-full rounded-lg overflow-hidden border border-border">
    <div className="aspect-video">
      <iframe
        src={`${slidesBaseUrl}/index.html`}
        className="w-full h-full border-0"
        allowFullScreen
      />
    </div>
  </div>
)}
```

#### 任务 3.3：ArticleDetailClient 适配

**文件**：`components/article/ArticleDetailClient.tsx`

**变更**：

1. `hasPodcastData` 判断改为 `article.contentTypes?.podcast !== undefined`
2. `hasSlidesData` 判断改为 `article.contentTypes?.slides !== undefined`
3. SlideViewer 传入 `mode` 和 `slidesBaseUrl`
4. 传递 `contentTypes` 给 ContentTypeSwitcher

#### 任务 3.4：SlidesSidebar 适配（可选增强）

**文件**：`components/article/SlidesSidebar.tsx`

如果 PPT 有 `screenshots/` 目录，侧边栏可用预渲染截图作为缩略图导航：

```tsx
// 使用 manifest + screenshots 构建缩略图列表
const thumbnails = manifest?.map(item => ({
  label: item.label,
  imageUrl: `${slidesBaseUrl}/screenshots/${item.file.replace('slides/', '').replace('.html', '.png')}`,
})) || [];
```

---

### 阶段四：R2 CORS 与部署配置

#### 任务 4.1：R2 CORS 配置

HTML 幻灯片的 `index.html` 通过 iframe 加载子页面（如 `slides/01-cover.html`），需要确保 R2 CDN 响应正确的 headers。

**方案**：在 Cloudflare Dashboard 中为 `lizizai-blog` bucket 配置 CORS 规则：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

或通过 Worker 在响应中添加 headers（如果已有 R2 代理 Worker）。

#### 任务 4.2：Worker 部署

更新 `workers/feishu-blog-sync/` 后重新部署：

```bash
cd workers/feishu-blog-sync
pnpm wrangler deploy
```

部署后手动触发一次同步验证：

```bash
curl -X POST $SYNC_URL -H "Authorization: Bearer $SYNC_TOKEN"
```

---

## 4. 兼容性策略

### 双模式共存

Worker `performSync()` 同时处理两种目录结构：

```
遍历分类文件夹下的项目：
├── 项目是 folder 且含"文章"子文件夹 → syncBlogFolder()（新逻辑）
├── 项目是 docx 文档                  → syncDocument()（旧逻辑）
└── 其他                              → 跳过
```

### 迁移路径

1. **即时生效**：已改造为文件夹结构的博客（如"李自在AI 日报 | 2026-05-05"）走新逻辑
2. **逐步迁移**：现有单文档博客可随时改造为文件夹结构，旧数据无需处理
3. **前端兼容**：`contentTypes` 字段为空时回退到旧的 `contentType` 判断

### 不需要迁移的场景

- 现有文章的 `content.md`、`images/`、`meta.json` 路径完全不变
- 前端旧路径请求继续有效
- 旧文章不改造也能正常工作

---

## 5. 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `workers/feishu-blog-sync/src/feishu.ts` | 修改 | 新增 downloadDriveFile()、listAllFilesRecursive() |
| `workers/feishu-blog-sync/src/sync.ts` | 修改 | 新增 syncBlogFolder/syncPodcastFolder/syncSlidesFolder，改造 performSync |
| `types/index.ts` | 修改 | 新增 ContentTypes 接口，Article 扩展 contentTypes/slidesBaseUrl 字段 |
| `lib/blog-data.ts` | 修改 | 新增 PPT/播客数据获取函数，适配新 R2 路径 |
| `components/article/ContentTypeSwitcher.tsx` | 修改 | 接收 contentTypes，动态显示按钮 |
| `components/article/SlideViewer.tsx` | 修改 | 新增 HTML iframe 模式 |
| `components/article/ArticleDetailClient.tsx` | 修改 | 适配新判断逻辑，传递 contentTypes |
| `components/article/SlidesSidebar.tsx` | 修改（可选） | 支持截图缩略图导航 |
| `workers/feishu-blog-sync/wrangler.toml` | 无变更 | 不需要新的 secrets 或 bindings |

---

## 6. 测试验证清单

### Worker 同步测试

- [x] 手动触发同步，确认新文件夹结构的博客被正确识别（2026-05-08 验证通过：18 篇文章同步成功）
- [x] 检查 R2 中 `content.md` 路径不变
- [x] 检查 R2 中 `podcast/audio.mp3` 和 `podcast/script.md` 正确生成
- [x] 检查 R2 中 `slides/` 文件树完整（index.html + slides/ + shared/ + screenshots/）
- [x] 检查 `meta.json` 包含 `contentTypes` 字段且数据正确（podcast=true, slides=true, slideCount=9）
- [x] 验证旧文档（非文件夹结构）仍正常同步
- [x] 验证 `articles.json` 索引包含新旧两种格式的文章

### 前端展示测试

- [x] 文章详情页：文章类型正常渲染（不变）
- [x] ContentTypeSwitcher：仅显示可用的内容类型按钮
- [x] 点击"播客"按钮：音频播放器加载成功，逐字稿可显示
- [x] 点击"PPT"按钮：HTML 幻灯片 iframe 加载成功，可导航
- [x] 无播客/PPT 的文章：ContentTypeSwitcher 仅显示"文章"按钮
- [x] 移动端：PPT iframe 响应式缩放正常
- [x] 列表/网格/首页：播客/PPT 文章显示类型标识（2026-05-10 补充完成）

### 清理测试

- [x] 在飞书中删除一个文件夹结构的博客
- [x] 触发同步后确认 R2 中对应的 `podcast/` 和 `slides/` 目录被清理

---

## 7. 风险与注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 飞书云盘文件下载 API 需要额外权限 | Worker 无法下载音频/HTML | 确保 App 有 `drive:drive:readonly` scope |
| HTML 幻灯片引用外部字体（Google Fonts） | 国内加载慢 | 可考虑 Worker 同步时将字体也下载到 R2 |
| R2 存储 PPT 文件体积增大（截图~1.5MB/篇） | 存储成本略增 | 单篇约 2MB，100 篇 ~200MB，R2 免费额度内 |
| iframe 加载 R2 跨域资源 | 幻灯片无法显示 | 确认 R2 CORS 配置正确 |
| 旧文章清理逻辑兼容 | 误删旧文章 | 清理时同时检查新旧 token 字段 |
