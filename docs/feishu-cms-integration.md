# 飞书文档 CMS 接入方案（v2 — 全面重构）

## 背景

**完全废弃**当前的本地 MDX 文件构建方式。飞书文档作为唯一内容源，文章和图片全部持久化到 Cloudflare R2，博客前端从 R2 直接读取内容。

## 整体架构

```
飞书文档（唯一内容源）
     │
     ▼
 同步 Worker（Cloudflare Workers）── 每天定时 + 手动触发
     │
     ├── 读取飞书文档 → 转换为 Markdown
     ├── 下载飞书图片 → 上传到 R2
     ├── 生成文章 JSON 元数据 → 存入 R2
     └── 清理 R2 中飞书已删除的文章
     │
     ▼
 Cloudflare R2（持久化存储）
     │
     ├── blog-data/
     │   ├── articles.json          ← 所有文章元数据索引
     │   └── articles/
     │       ├── ai-prompts/        ← 按分类组织
     │       │   └── {slug}/
     │       │       ├── meta.json  ← 文章元数据
     │       │       ├── content.md ← Markdown 正文
     │       │       └── images/    ← 文章图片
     │       ├── premium-course/
     │       ├── portfolio/
     │       ├── human-3-0/
     │       ├── lifestyle/
     │       ├── featured/
     │       └── writing-strategies/
     │
     ▼
 Next.js 前端（Vercel）
     │
     ├── build 时从 R2 拉取 articles.json → SSG 静态页面
     └── 前台「同步」按钮 → 触发 Worker 同步 → ISR 更新页面
```

---

## Step 1: 飞书文件夹 → 博客分类映射

### 1a. 飞书文件夹结构

在飞书云文档中，以 `RnSDfNdqZlcEtud4JjpcjtpKncg` 为根文件夹，创建以下 **4个子文件夹**：

```
博客文章（根文件夹 RnSDfNdqZlcEtud4JjpcjtpKncg）
├── AI                   → slug: ai
│   └── 记录我在AI上面的探索和实践
├── Premium Course       → slug: premium-course
│   └── 我推出的一些优质的课程
├── Portfolio            → slug: portfolio
│   └── 我的个人作品集
└── HUMAN 3.0            → slug: human-3-0
    └── 我对人类3.0的认知感悟
```

**已移除的分类**（不再使用）：Lifestyle、Featured、Writing Strategies

**映射规则**：每个子文件夹的名称对应博客导航Tab，子文件夹下的每篇飞书文档就是该分类下的一篇文章。

### 1b. 分类配置持久化

分类定义不再放在 Git 仓库的 `content/categories.yml` 中，改为存入 R2。首次同步时，同步 Worker 自动扫描根文件夹下的4个子文件夹，生成映射表：

```json
// R2: blog-data/categories.json
[
  { 
    "name": "AI", 
    "slug": "ai", 
    "description": "记录我在AI上面的探索和实践",
    "folder_token": "子文件夹token"
  },
  { 
    "name": "Premium Course", 
    "slug": "premium-course", 
    "description": "我推出的一些优质的课程",
    "folder_token": "子文件夹token"
  },
  { 
    "name": "Portfolio", 
    "slug": "portfolio", 
    "description": "我的个人作品集",
    "folder_token": "子文件夹token"
  },
  { 
    "name": "HUMAN 3.0", 
    "slug": "human-3-0", 
    "description": "我对人类3.0的认知感悟",
    "folder_token": "子文件夹token"
  }
]
```

**已移除的分类**：Lifestyle、Featured、Writing Strategies（不再同步到 R2）

首次同步时，同步 Worker 自动扫描根文件夹下的子文件夹，生成这个映射表。

### 1c. 文章元数据约定

每篇飞书文档就是一个文章。元数据来源优先级：

1. **文档标题** → 文章 title
2. **文档内容第一段**（如果是 YAML 代码块）→ 作为 frontmatter 解析，可覆盖 title、指定 slug、tags、excerpt、date 等
3. **所在文件夹** → 自动推断 category
4. **文档最后修改时间** → 更新时间
5. **文档创建时间** → 发布时间

文档开头可选的元数据声明（代码块，语言标记为 `yaml`）：

````markdown
```yaml
slug: my-custom-slug
tags: [AI, productivity, prompts]
excerpt: 自定义摘要
date: 2025-10-15
coverImage: ./cover.jpg
```
````

如果不写这段，slug 自动从标题生成，其他字段自动推断。

---

## Step 2: Cloudflare R2 存储

### 2a. 创建 R2 Bucket

创建一个名为 `lizizai-blog` 的 R2 bucket。

### 2b. R2 存储结构

```
lizizai-blog/
├── blog-data/
│   ├── articles.json                     ← 全量文章索引（用于 SSG）
│   ├── categories.json                   ← 分类配置
│   └── articles/
│       └── {category-slug}/
│           └── {article-slug}/
│               ├── meta.json             ← 文章元数据（title, date, tags, excerpt 等）
│               ├── content.md            ← 转换后的 Markdown 正文
│               └── images/
│                   ├── cover.jpg         ← 封面图（如果有）
│                   ├── img-001.png       ← 文章内图片
│                   └── img-002.png
```

### 2c. articles.json 格式

```json
[
  {
    "slug": "dopamine-detox-reset-life-30-days",
    "title": "A dopamine detox to reset your life in 30 days",
    "excerpt": "Because most of modern life has become a blur",
    "category": { "name": "Lifestyle", "slug": "lifestyle" },
    "tags": [{ "name": "Lifestyle", "slug": "lifestyle" }],
    "publishedAt": "2025-10-15T00:00:00.000Z",
    "updatedAt": "2025-10-20T00:00:00.000Z",
    "readingTime": 10,
    "coverImage": "/api/blog/images/lifestyle/dopamine-detox/cover.jpg",
    "contentPath": "/api/blog/articles/lifestyle/dopamine-detox/content.md",
    "feishuDocToken": "doxcnXXXX"
  }
]
```

### 2d. 图片访问

通过 Next.js API Route 代理 R2 图片，或者给 R2 bucket 绑定自定义域名。

**方案 A（推荐）：R2 自定义域名**

在 Cloudflare 中为 `lizizai-blog` bucket 绑定自定义域名，如 `cdn.lizizai.xyz`。图片可直接通过 `https://cdn.lizizai.xyz/blog-data/articles/lifestyle/dopamine-detox/images/cover.jpg` 访问。

**方案 B：Next.js API Route 代理**

```
GET /api/blog/images/{category}/{slug}/{filename}
→ 从 R2 读取图片 → 返回图片响应（带缓存头）
```

---

## Step 3: 同步 Worker

### 3a. Worker 架构

创建一个 Cloudflare Worker `feishu-blog-sync`，职责：

1. 从飞书拉取所有文档
2. 转换为 Markdown + 元数据
3. 下载图片上传到 R2
4. 清理已删除的文章

```
feishu-blog-sync/
├── wrangler.toml
├── src/
│   ├── index.ts          ← Worker 入口
│   ├── feishu.ts         ← 飞书 API 客户端
│   ├── converter.ts      ← 飞书文档块 → Markdown
│   └── sync.ts           ← 同步逻辑
```

### 3b. 环境绑定

```toml
# wrangler.toml
name = "feishu-blog-sync"

[[r2_buckets]]
binding = "R2"
bucket_name = "lizizai-blog"

[vars]
FEISHU_APP_ID = "cli_a951d50564f89bb5"
FEISHU_FOLDER_TOKEN = "RnSDfNdqZlcEtud4JjpcjtpKncg"

# Secrets (通过 wrangler secret put)
# FEISHU_APP_SECRET
```

### 3c. 同步流程

```
1. 获取飞书 tenant_access_token

2. 扫描根文件夹下的子文件夹
   → 读取或创建 categories.json
   → 建立 folder_token → category-slug 映射

3. 遍历每个子文件夹：
   for each category_folder:
     a. 列出所有 docx 文档
     b. for each doc:
        - 获取文档标题和创建/修改时间
        - 获取文档所有 blocks
        - 解析开头的 YAML frontmatter（如果有）
        - 转换 blocks 为 Markdown
        - 下载文档中的图片，上传到 R2:
          R2.put("blog-data/articles/{cat}/{slug}/images/{filename}", imageBuffer)
        - 替换 Markdown 中的图片引用为 R2 URL
        - 保存 content.md 到 R2
        - 保存 meta.json 到 R2

4. 生成全量 articles.json 并上传到 R2

5. 一致性清理：
   - 获取 R2 中所有现有的文章目录
   - 对比飞书文档列表
   - 删除飞书中已不存在的文章目录
```

### 3d. 触发方式

**定时触发（每天一次）**：

```toml
# wrangler.toml
[triggers]
crons = ["0 3 * * *"]   # 每天北京时间 11:00
```

**手动触发（前台按钮）**：

Worker 暴露一个 HTTP 端点：

```
POST https://sync.lihehua.xyz/sync
Header: X-Sync-Token: {一个预设的 secret token}
```

前端按钮点击后调用这个端点触发同步。

### 3e. 一致性保证

每次同步的清理逻辑：

```typescript
async function cleanupDeletedArticles(r2Keys: string[], feishuDocTokens: Set<string>) {
  // 从 R2 中的文章列表中，找出飞书里已经没有的
  const existingSlugs = getArticleSlugsFromR2Keys(r2Keys);
  const feishuSlugs = new Set(feishuDocTokens);

  for (const slug of existingSlugs) {
    if (!feishuSlugs.has(slug)) {
      // 删除该文章在 R2 中的所有文件（meta.json, content.md, images/*）
      await deleteArticleFromR2(slug);
      console.log(`✗ 删除: ${slug}`);
    }
  }
}
```

---

## Step 4: 前端改造

### 4a. 移除本地 MDX 依赖

删除 `content/articles/` 目录和 `lib/content.ts` 中从本地文件读取的逻辑。

### 4b. 新的数据层 `lib/blog-data.ts`

```typescript
// 从 R2（通过自定义域名或 API Route）获取文章数据

const R2_BASE = process.env.R2_PUBLIC_URL || 'https://cdn.lizizai.xyz';

// 获取所有文章（从 articles.json）
export async function getAllArticles(): Promise<Article[]> {
  const res = await fetch(`${R2_BASE}/blog-data/articles.json`, {
    next: { revalidate: 3600 }, // ISR: 每小时重新验证
  });
  return res.json();
}

// 获取单篇文章内容
export async function getArticleContent(categorySlug: string, articleSlug: string): Promise<string> {
  const res = await fetch(`${R2_BASE}/blog-data/articles/${categorySlug}/${articleSlug}/content.md`);
  return res.text();
}

// 获取文章元数据
export async function getArticleMeta(categorySlug: string, articleSlug: string): Promise<ArticleMeta> {
  const res = await fetch(`${R2_BASE}/blog-data/articles/${categorySlug}/${articleSlug}/meta.json`);
  return res.json();
}

// 获取分类列表
export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${R2_BASE}/blog-data/categories.json`, {
    next: { revalidate: 3600 },
  });
  return res.json();
}
```

### 4c. 页面改造

所有页面从 `lib/blog-data.ts` 获取数据，不再从本地文件系统读取：

```typescript
// app/page.tsx
export const revalidate = 3600; // ISR 每小时刷新

export default async function Home() {
  const articles = await getAllArticles();
  // ... 渲染
}

// app/article/[slug]/page.tsx
export const revalidate = 3600;

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const articles = await getAllArticles();
  const article = articles.find(a => a.slug === slug);
  const content = await getArticleContent(article.category.slug, slug);
  // ... 渲染
}
```

由于不再使用 `generateStaticParams` + 本地 MDX，改用 ISR（Incremental Static Regeneration）。首次访问时生成页面，之后每小时自动刷新。

### 4d. 同步按钮

在页面底部或管理区域添加一个「同步飞书文档」按钮：

```tsx
// components/SyncButton.tsx
'use client';

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(process.env.NEXT_PUBLIC_SYNC_URL!, {
        method: 'POST',
        headers: { 'X-Sync-Token': process.env.NEXT_PUBLIC_SYNC_TOKEN! },
      });
      // 等待同步完成后刷新页面
      await new Promise(r => setTimeout(r, 5000));
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button onClick={handleSync} disabled={syncing}>
      {syncing ? '同步中...' : '同步飞书文档'}
    </button>
  );
}
```

---

## Step 5: 飞书文档块 → Markdown 转换器

### 5a. Block 类型映射

| block_type | 飞书类型 | Markdown 输出 |
|---|---|---|
| 2 | 文本 | 段落，处理行内样式 |
| 3-11 | 标题 1-9 | `# ` ~ `######### ` |
| 12 | 无序列表 | `- ` |
| 13 | 有序列表 | `1. ` |
| 14 | 代码块 | ` ```lang ... ``` ` |
| 15 | 引用 | `> ` |
| 17 | 待办 | `- [ ] / - [x]` |
| 19 | 高亮块 | `> **💡** ...` |
| 22 | 分割线 | `---` |
| 27 | 图片 | `![alt](R2图片URL)` |
| 31 | 表格 | Markdown 表格 |

### 5b. 行内样式映射

| 样式 | Markdown |
|---|---|
| bold | `**text**` |
| italic | `*text*` |
| strikethrough | `~~text~~` |
| inline_code | `` `text` `` |
| link | `[text](url)` |

### 5c. 图片处理

1. 从 block 中获取 `image_token`
2. 通过飞书 API 下载图片二进制数据
3. 生成文件名（如 `img-{序号}.png` 或使用原始文件名）
4. 上传到 R2: `blog-data/articles/{cat}/{slug}/images/{filename}`
5. Markdown 中替换为 R2 URL

---

## Step 6: 移除旧内容系统

完成 Step 4 后，删除以下文件/目录：

| 目标 | 操作 |
|---|---|
| `content/articles/` | 删除整个目录 |
| `content/categories.yml` | 删除 |
| `content/tags.yml` | 删除 |
| `content/authors/` | 删除 |
| `lib/content.ts` | 重写为 `lib/blog-data.ts` |

---

## 实施顺序

| 阶段 | 内容 | 预估时间 |
|---|---|---|
| Phase 1 | 创建 R2 bucket + 同步 Worker（飞书 → R2） | 4-5 小时 |
| Phase 2 | 前端数据层改造（R2 → 页面） | 2-3 小时 |
| Phase 3 | 同步按钮 + ISR 配置 | 1 小时 |
| Phase 4 | 清理旧代码 + 测试验证 | 1-2 小时 |

**总计：约 8-11 小时**

---

## 环境变量汇总

### Cloudflare Worker（feishu-blog-sync）

| 变量 | 说明 |
|---|---|
| `FEISHU_APP_ID` | 飞书应用 ID（vars） |
| `FEISHU_APP_SECRET` | 飞书应用密钥（secret） |
| `FEISHU_FOLDER_TOKEN` | 博客根文件夹 token（vars） |
| `SYNC_TOKEN` | 手动触发的验证 token（secret） |
| R2 binding | `lizizai-blog` bucket |

### Next.js（Vercel）

| 变量 | 说明 |
|---|---|
| `R2_PUBLIC_URL` | R2 自定义域名，如 `https://cdn.lizizai.xyz` |
| `NEXT_PUBLIC_SYNC_URL` | 同步 Worker URL |
| `NEXT_PUBLIC_SYNC_TOKEN` | 同步触发 token |

---

## 验证方式

1. 在飞书各子文件夹中创建测试文档（含标题、段落、代码块、图片）
2. 触发同步 Worker，检查 R2 中是否生成了正确的文件结构
3. 访问 `cdn.lizizai.xyz/blog-data/articles.json` 验证索引数据
4. 启动 Next.js 开发服务器，首页应显示飞书中的文章
5. 点击文章，内容应正确渲染（包括图片）
6. 在飞书中删除一篇文章，再次同步，R2 和前端应同步删除
7. 点击前端「同步」按钮，手动触发同步后页面刷新应显示最新内容
