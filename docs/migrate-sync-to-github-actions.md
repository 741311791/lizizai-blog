# 飞书同步从 Cloudflare Worker 迁移到 GitHub Actions

> 日期：2026-05-08
> 状态：待实施
> 关联文档：`docs/multi-content-type-sync.md`

## 1. 背景与动机

### 当前问题

飞书博客同步运行在 Cloudflare Worker 上，受限于 Worker 的**子请求配额（50 次/invocation）**。多内容类型文章（文章 + 播客 + PPT）的同步消耗大量子请求：

| 操作 | 子请求数 |
|------|---------|
| 飞书 listFiles × 3（分类+子文件夹+文章文件夹） | 3 |
| getDocumentBlocks（分页） | 2-4 |
| 图片下载 + 上传 R2（每张 2 次） | 6-10 |
| 播客音频下载 + 上传 | 2 |
| PPT 文件下载 + 上传（9 页 + 截图） | 20+ |
| R2 读写（meta.json、content.md、任务清单） | 10+ |
| **单篇多内容类型文章总计** | **45-50+** |

两篇多内容类型文章就耗尽配额。当前通过**链式自调用**绕过限制，但架构复杂、不可靠，已导致文章丢失（05-05 日报同步失败）。

### 迁移收益

| 维度 | 迁移前（Worker） | 迁移后（GitHub Actions） |
|------|-----------------|------------------------|
| 外部请求限制 | 50 次/invocation | **无限制** |
| 执行时间 | 30 秒（付费 15 分钟） | **360 分钟** |
| 架构复杂度 | 高（链式调用 + 任务清单 + R2 状态） | **低（单进程顺序执行）** |
| 调试体验 | 差（wrangler tail 不稳定） | **好（完整日志输出）** |
| 代码量 | sync.ts 1060 行 | 预计 **600 行**（删除链式调用） |

---

## 2. 目标架构

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────┐
│  GitHub Actions  │────→│  同步脚本 (Node.js)   │────→│  R2 (S3) │
│  CRON / 手动触发  │     │                      │     │          │
│                  │     │  feishu.ts (不变)     │     │ blog-data│
│  每日 03:00 CST  │     │  converter.ts (不变)  │     │ /articles│
│                  │     │  sync.ts (重写)       │     │          │
└─────────────────┘     └──────────────────────┘     └──────────┘
                                │
                                ↓
                        ┌──────────────┐
                        │   飞书 API    │
                        │  open.feishu  │
                        └──────────────┘
```

**保留 Worker**：只保留 `/status`、`/health`、`/debug/feishu` 等只读端点，供线上服务查询同步状态。

---

## 3. 实施步骤

### 阶段一：创建 S3 存储层

#### 任务 1.1：新建 `lib/r2-client.ts`

**文件**：`workers/feishu-blog-sync/src/lib/r2-client.ts`

封装 S3 兼容的 R2 操作，提供与原 `R2Bucket` 接口一致的方法签名，使 sync.ts 的改动最小化。

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class R2Client {
  private s3: S3Client;
  private bucket: string;

  constructor(config: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  }) {
    this.s3 = new S3Client({
      endpoint: config.endpoint,
      region: 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucket;
  }

  async get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null> { ... }
  async put(key: string, value: ArrayBuffer | string, options?: { httpMetadata?: { contentType: string } }): Promise<void> { ... }
  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }> { ... }
  async delete(key: string): Promise<void> { ... }
}
```

#### 任务 1.2：安装依赖

```bash
cd workers/feishu-blog-sync
pnpm add @aws-sdk/client-s3
pnpm add -D @types/node tsx
```

---

### 阶段二：重写 sync.ts

#### 任务 2.1：移除链式调用机制

**删除以下代码**（约 400 行）：

| 删除项 | 说明 |
|--------|------|
| `SyncTaskList` 接口 | 任务清单数据结构 |
| `SyncTask` 联合类型 | 链式调用任务类型 |
| `loadTaskList` / `saveTaskList` / `cleanupTaskList` | R2 任务清单管理 |
| `scanAndStartChain` | 链式扫描启动函数 |
| `processBatch` | 分批处理函数 |
| `findNextUnrelatedTask` | 失败跳过逻辑 |
| `WORKERS_DEV_URL` 常量 | workers.dev 链式调用 |
| 所有 `handleSyncBlogFolderSplit` 中的子任务拆分 | 改为直接顺序执行 |

#### 任务 2.2：重写 `performSync` 为主流程函数

**文件**：`workers/feishu-blog-sync/src/sync.ts`

重写为简单的顺序执行流程，无子请求限制：

```typescript
export async function performSync(env: SyncEnv): Promise<{ articleCount: number }> {
  const client = new FeishuClient(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
  const r2 = env.R2;

  // 1. 扫描根文件夹，生成分类列表
  const rootFiles = await client.listFiles(env.FEISHU_FOLDER_TOKEN);
  const categories = buildCategories(rootFiles, env.FEISHU_FOLDER_TOKEN);

  // 2. 加载已有索引（增量判断）
  const existingIndex = await loadExistingIndex(r2, env.R2_BASE_PATH);
  const existingDocTokenMap = new Map(existingIndex.map(a => [a.feishuDocToken, a]));

  // 3. 顺序处理每篇文章
  const allArticles: ArticleMeta[] = [];
  const allDocTokens: string[] = [];
  const allFolderTokens: string[] = [];

  for (const category of categories) {
    const items = await client.listFiles(category.folderToken);
    console.log(`[sync] ${category.name}: ${items.length} 项`);

    for (const item of items) {
      if (item.type === 'folder') {
        // 多内容类型文件夹
        const article = await syncBlogFolder(client, item, category, env);
        if (article) {
          allArticles.push(article);
          allFolderTokens.push(item.token);
        }
      } else if (item.type === 'docx') {
        // 单文档文章（旧格式兼容）
        const cached = existingDocTokenMap.get(item.token);
        if (cached) {
          allArticles.push(cached);
        } else {
          const article = await syncDocument(client, item, category, r2, env.R2_BASE_PATH, env.R2_PUBLIC_URL);
          allArticles.push(article);
        }
        allDocTokens.push(item.token);
      }
    }
  }

  // 4. 写入索引
  await r2.put(`${env.R2_BASE_PATH}/articles.json`, JSON.stringify(allArticles, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  // 5. 清理已删除文章
  await cleanupDeletedArticles(r2, env.R2_BASE_PATH, new Set(allDocTokens), new Set(allFolderTokens), categories);

  console.log(`[sync] 同步完成: ${allArticles.length} 篇文章`);
  return { articleCount: allArticles.length };
}
```

#### 任务 2.3：简化 `syncBlogFolder`

**文件**：`workers/feishu-blog-sync/src/sync.ts`

不再拆分为子任务，直接在函数内顺序执行文章、播客、PPT 同步：

```typescript
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

  // 2. 同步播客（可选）
  let podcastMeta: PodcastMeta | undefined;
  if (podcastFolder) {
    try {
      podcastMeta = await syncPodcastFolder(client, podcastFolder, baseMeta.slug, category, env.R2, env.R2_BASE_PATH);
    } catch (err) {
      console.error(`  播客同步失败（不影响文章）:`, err);
    }
  }

  // 3. 同步 PPT（可选）
  let slidesMeta: SlidesMeta | undefined;
  if (slidesFolder) {
    try {
      slidesMeta = await syncSlidesFolder(client, slidesFolder, baseMeta.slug, category, env.R2, env.R2_BASE_PATH);
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

  if (podcastMeta) { fullMeta.contentType = 'podcast'; fullMeta.audioDuration = podcastMeta.audioDuration; }
  if (slidesMeta)  { fullMeta.contentType = 'slides'; fullMeta.slideCount = slidesMeta.slideCount; }

  // 写入最终 meta.json
  await env.R2.put(
    `${env.R2_BASE_PATH}/articles/${category.slug}/${baseMeta.slug}/meta.json`,
    JSON.stringify(fullMeta, null, 2),
    { httpMetadata: { contentType: 'application/json' } },
  );

  return fullMeta;
}
```

#### 任务 2.4：保持不变的部分

以下函数**无需修改**，直接复用：

| 函数 | 文件 | 说明 |
|------|------|------|
| `FeishuClient` 类 | `feishu.ts` | 飞书 API 客户端，使用标准 `fetch`，无需改动 |
| `convertBlocksToMarkdown` | `converter.ts` | 飞书块 → Markdown 转换，纯逻辑 |
| `syncDocument` | `sync.ts` | 单文档同步（需将 `r2` 参数改为 `R2Client`） |
| `syncPodcastFolder` | `sync.ts` | 播客文件夹同步 |
| `syncSlidesFolder` | `sync.ts` | PPT 文件夹同步 |
| `cleanupDeletedArticles` | `sync.ts` | 清理已删除文章 |
| 所有工具函数 | `sync.ts` | `slugify`、`calculateReadingTime`、`getContentType`、`parseDeckManifest` |

---

### 阶段三：创建同步入口脚本

#### 任务 3.1：新建 `sync.ts` 入口

**文件**：`workers/feishu-blog-sync/src/cli.ts`

```typescript
#!/usr/bin/env npx tsx
/**
 * 飞书博客同步 CLI 入口
 * 用法：npx tsx src/cli.ts
 * 在 GitHub Actions 或本地执行
 */

import { performSync } from './sync';
import { R2Client } from './lib/r2-client';

async function main() {
  // 从环境变量读取配置
  const env = {
    R2: new R2Client({
      endpoint: process.env.R2_ENDPOINT!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucket: process.env.R2_BUCKET_NAME || 'lizizai-blog',
    }),
    FEISHU_APP_ID: process.env.FEISHU_APP_ID!,
    FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET!,
    FEISHU_FOLDER_TOKEN: process.env.FEISHU_FOLDER_TOKEN || 'RnSDfNdqZlcEtud4JjpcjtpKncg',
    R2_BASE_PATH: process.env.R2_BASE_PATH || 'blog-data',
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || 'https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev',
  };

  // 验证必要环境变量
  const required = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`缺少环境变量: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log(`[sync] 开始同步: ${new Date().toISOString()}`);
  const result = await performSync(env);
  console.log(`[sync] 完成: ${result.articleCount} 篇文章`);
}

main().catch(err => {
  console.error('[sync] 致命错误:', err);
  process.exit(1);
});
```

---

### 阶段四：GitHub Actions 工作流

#### 任务 4.1：创建工作流文件

**文件**：`.github/workflows/feishu-sync.yml`

```yaml
name: 飞书博客同步

on:
  # 每日北京时间 03:00（UTC 19:00 前一天）
  schedule:
    - cron: '0 19 * * *'

  # 手动触发
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: workers/feishu-blog-sync/pnpm-lock.yaml

      - name: 安装依赖
        run: ppm install
        working-directory: workers/feishu-blog-sync

      - name: 执行同步
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_FOLDER_TOKEN: ${{ secrets.FEISHU_FOLDER_TOKEN }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET_NAME: lizizai-blog
          R2_BASE_PATH: blog-data
          R2_PUBLIC_URL: https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev
        run: npx tsx src/cli.ts
        working-directory: workers/feishu-blog-sync

      - name: 同步结果通知（失败时）
        if: failure()
        run: |
          echo "::error::飞书博客同步失败，请检查日志"
```

#### 任务 4.2：配置 GitHub Secrets

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中添加：

| Secret 名称 | 来源 | 说明 |
|-------------|------|------|
| `FEISHU_APP_ID` | 现有 wrangler.toml vars | 飞书应用 ID |
| `FEISHU_APP_SECRET` | 现有 Worker secret | 飞书应用密钥 |
| `FEISHU_FOLDER_TOKEN` | 现有 wrangler.toml vars | 飞书根文件夹 token |
| `R2_ENDPOINT` | Cloudflare Dashboard | `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Cloudflare Dashboard → R2 → Manage R2 API Tokens | S3 兼容 API 访问密钥 |
| `R2_SECRET_ACCESS_KEY` | 同上 | S3 兼容 API 密钥 |

创建 R2 API Token 的步骤：
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create API Token
3. 权限选择：Object Read & Write
4. 指定 Bucket：`lizizai-blog`
5. 生成后保存 Access Key ID 和 Secret Access Key

---

### 阶段五：Worker 精简

#### 任务 5.1：精简 Worker 职责

**文件**：`workers/feishu-blog-sync/src/index.ts`

Worker 保留为只读服务，删除同步相关端点：

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/health') { ... }

    // 同步状态（读取 R2 中的 articles.json）
    if (url.pathname === '/status') { ... }

    // 调试：查看飞书文件夹结构
    if (url.pathname === '/debug/feishu' && request.method === 'GET') { ... }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, ... });
  },

  // CRON 不再触发同步，改为空操作或直接删除
  // 如果想保留 CRON 作为 backup 触发 GitHub Actions workflow:
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // 可选：通过 repository_dispatch 触发 GitHub Actions
    // 或直接删除此函数和 wrangler.toml 中的 cron
  },
};
```

#### 任务 5.2：更新 wrangler.toml

```toml
name = "feishu-blog-sync"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "R2"
bucket_name = "lizizai-blog"

# 删除 CRON 触发器（同步已迁移到 GitHub Actions）
# [triggers]
# crons = ["0 1 * * *"]

[vars]
FEISHU_APP_ID = "cli_a951d50564f89bb5"
FEISHU_FOLDER_TOKEN = "RnSDfNdqZlcEtud4JjpcjtpKncg"
R2_BASE_PATH = "blog-data"
R2_PUBLIC_URL = "https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev"

routes = [
  { pattern = "feishu-blog-sync.lihehua.xyz", custom_domain = true }
]
```

---

## 4. 代码清理计划

### 删除的文件

| 文件 | 说明 |
|------|------|
| — | 无文件删除，现有文件保留但内容精简 |

### 删除的代码（sync.ts）

| 删除项 | 预计行数 | 说明 |
|--------|---------|------|
| `SyncTaskList` 接口 | ~10 | 任务清单数据结构 |
| `SyncTask` 联合类型 | ~7 | 6 种链式调用任务类型 |
| `WORKERS_DEV_URL` 常量 | ~2 | workers.dev 链式调用 |
| `TASK_KEY` / `loadTaskList` / `saveTaskList` / `cleanupTaskList` | ~30 | R2 任务清单读写 |
| `scanAndStartChain` | ~45 | 链式扫描启动 |
| `processBatch` | ~60 | 分批处理（含所有 case） |
| `handleSyncDocument` | ~15 | 任务分发包装 |
| `handleSyncBlogFolderSplit` | ~75 | 子任务拆分 |
| `handleSyncBlogArticle` | ~40 | 文章子任务 |
| `handleSyncBlogPodcast` | ~20 | 播客子任务 |
| `handleSyncBlogSlides` | ~20 | PPT 子任务 |
| `handleAssembleBlogMeta` | ~80 | meta 组装子任务 |
| `findNextUnrelatedTask` | ~12 | 失败跳过逻辑 |
| finalize 中的兜底恢复逻辑 | ~50 | 链式调用失败后的补救 |
| **合计删除** | **~466 行** | |

### 新增的代码

| 新增项 | 预计行数 | 说明 |
|--------|---------|------|
| `lib/r2-client.ts` | ~80 | S3 兼容 R2 客户端 |
| `cli.ts` | ~40 | GitHub Actions 入口脚本 |
| `performSync` 重写 | ~80 | 顺序同步主流程 |
| `syncBlogFolder` 重写 | ~50 | 合并后的文件夹同步 |
| **合计新增** | **~250 行** | |

### 净效果

| 指标 | 迁移前 | 迁移后 | 变化 |
|------|--------|--------|------|
| sync.ts | 1060 行 | ~600 行 | -43% |
| index.ts | 183 行 | ~80 行 | -56% |
| 总代码量 | 2012 行 | ~1650 行 | -18% |
| 新增文件 | — | 2 个 | +2 |
| 逻辑复杂度 | 高（链式+任务清单+兜底） | **低（顺序执行）** | 大幅降低 |

---

## 5. 测试验证计划

### 本地测试

```bash
# 1. 设置环境变量（从 .env.local 或直接 export）
export FEISHU_APP_ID=...
export FEISHU_APP_SECRET=...
export R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
export R2_ACCESS_KEY_ID=...
export R2_SECRET_ACCESS_KEY=...

# 2. 运行同步脚本
cd workers/feishu-blog-sync
npx tsx src/cli.ts
```

### 验证清单

- [ ] 本地运行 `cli.ts`，确认 14 篇文章全部同步成功
- [ ] 检查 R2 中 `articles.json` 包含所有文章（含 05-05）
- [ ] 检查多内容类型文章的 `contentTypes` 结构正确
- [ ] 检查 `podcast/audio.mp3` 和 `podcast/script.md` 存在
- [ ] 检查 `slides/` 文件树完整（index.html + slides/ + shared/ + screenshots/）
- [ ] 确认旧格式文章（单 docx）正常同步
- [ ] 确认 Worker `/status` 端点正常返回

### GitHub Actions 验证

- [ ] 推送代码后，手动触发 workflow（workflow_dispatch）
- [ ] 检查 Actions 日志输出正常
- [ ] 检查 R2 数据与本地测试一致
- [ ] 配置 schedule 后等待自动触发验证

---

## 6. 回滚方案

如果 GitHub Actions 同步出现问题：

1. **恢复 Worker CRON**：取消 wrangler.toml 中 cron 的注释，重新部署 Worker
2. **恢复旧 sync.ts**：从 git 历史恢复链式调用版本的 sync.ts
3. **R2 数据不受影响**：两种方案写入 R2 的数据格式完全一致

---

## 7. 实施时间表

| 阶段 | 预计时间 | 依赖 |
|------|---------|------|
| 阶段一：S3 存储层 | 30 分钟 | — |
| 阶段二：重写 sync.ts | 1 小时 | 阶段一 |
| 阶段三：CLI 入口脚本 | 30 分钟 | 阶段二 |
| 阶段四：GitHub Actions 工作流 | 30 分钟 | 阶段三 + Secrets 配置 |
| 阶段五：Worker 精简 | 30 分钟 | 阶段四验证通过 |
| 测试验证 | 30 分钟 | 全部完成 |
| **总计** | **约 3.5 小时** | |
