# 功能升级执行计划

> 生成日期：2026-04-17
> 涵盖：高优先级 + 中优先级 + 全站移动端适配

---

## 总览

| 阶段 | 内容 | 涉及文件数 | 预估工时 |
|------|------|-----------|---------|
| Phase 1 | 移动端全站适配 | ~12 | 3h |
| Phase 2 | 基础体验补全（RSS / 404 / 进度条 / 回到顶部） | ~8 | 2h |
| Phase 3 | 搜索与导航升级（Cmd+K / 标签页） | ~6 | 2h |
| Phase 4 | 内容增强（相关文章优化 / 图片灯箱 / 隐私页） | ~8 | 2h |
| Phase 5 | 构建验证 & 清理 | ~2 | 0.5h |

**总计约 9.5 小时，建议分 3-4 次完成。**

---

## Phase 1：全站移动端适配

### 1.1 Header 移动端导航（核心）

**问题**：Header 有 6 个导航链接 + Logo + 按钮，无任何移动端断点处理，小屏幕必然溢出。

**方案**：
- 桌面端（≥768px）：保持现有水平导航
- 移动端（<768px）：Logo + 汉堡菜单按钮（Menu 图标）
- 点击汉堡 → 从右侧滑出 Sheet（`components/ui/sheet.tsx` 已存在），包含导航链接 + Subscribe 按钮
- Share 按钮保留在 Header 右侧（汉堡按钮左侧）

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/layout/Header.tsx` | 重写，添加 Sheet 移动菜单 |
| `components/layout/MobileNav.tsx` | 新建，Sheet 内的移动导航组件 |

**Header.tsx 结构**：
```
┌─ <md ──────────────────────────────┐
│ [Logo]          [Share] [☰ Menu]   │
├─ ≥md ──────────────────────────────┤
│ [Logo]                   [Share] [Subscribe] │
│ [Home] [AI] [HUMAN 3.0] ... [Archive]       │
└────────────────────────────────────┘
```

**MobileNav.tsx 内容**：
- 导航链接列表（与桌面一致）
- Subscribe 按钮
- 底部分割线 + 站点名

### 1.2 文章页移动端目录

**问题**：`TableOfContents.tsx` 使用 `hidden lg:block`，移动端完全无目录。

**方案**：文章详情页底部（作者卡片之前）添加可折叠的 TOC 组件：
- 移动端（<1024px）：Collapsible 组件，默认折叠
- 桌面端（≥1024px）：保持现有侧边栏不变

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/article/MobileToc.tsx` | 新建，可折叠 TOC |
| `app/article/[slug]/page.tsx` | 在移动端渲染 MobileToc |

### 1.3 AboutMe 区块头像适配

**问题**：头像 `w-80 h-80`（320px）在小屏幕溢出。

**修改**：
```
w-80 h-80  →  w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80
```

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/home/AboutMe.tsx` | 修改头像和 grid 响应式类名 |

Grid 也需调整：
```
lg:grid-cols-[400px_1fr]  →  lg:grid-cols-[280px_1fr]
```

### 1.4 文章内容排版适配

**问题**：`ArticleContent.tsx` 中 h1 `text-4xl`、h2 `text-3xl` 在小屏幕偏大。

**修改**：
```
h1: text-4xl           → text-2xl md:text-3xl lg:text-4xl
h2: text-3xl           → text-xl md:text-2xl lg:text-3xl
h3: text-2xl semibold  → text-lg md:text-xl lg:text-2xl
```

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/article/ArticleContent.tsx` | 修改 heading 响应式类名 |

### 1.5 ArticleCard 触控适配

**问题**：hover 覆盖层在触屏设备无法触发（需 hover + 显示点赞/评论/分享数据）。

**方案**：在移动端将互动数据直接显示在卡片底部（不用 hover 覆盖），桌面端保持 hover 覆盖。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/article/ArticleCard.tsx` | 移动端显示底部数据条，桌面端 hover overlay |

### 1.6 其他细节修复

| 文件 | 问题 | 修复 |
|------|------|------|
| `components/article/ArticleListItem.tsx` | 分享按钮 hover 才显示，触屏不可达 | 移动端始终显示 |
| `components/article/ArticlesSection.tsx` | LayoutToggle 在小屏占位 | `hidden sm:flex` |
| `components/article/CategoryArticlesSection.tsx` | 同上 | `hidden sm:flex` |
| `components/layout/Footer.tsx` | Newsletter 表单的 subscribe API 指向旧 Strapi | 改为 `/api/subscribe` |

---

## Phase 2：基础体验补全

### 2.1 RSS Feed

**方案**：Next.js App Router 路由处理器生成 RSS 2.0 XML。

**路由**：`GET /feed.xml` → `app/feed.xml/route.ts`

**内容**：
- 获取 `getAllArticles()` 最新 20 篇
- 生成标准 RSS 2.0 XML（title, link, description, pubDate, guid）
- 设置 `Content-Type: application/xml`
- 在 `<head>` 中添加 `<link rel="alternate" type="application/rss+xml">` （通过根 layout 的 metadata）

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `app/feed.xml/route.ts` | 新建，RSS 生成 |
| `app/layout.tsx` | 添加 RSS alternates metadata |

### 2.2 自定义 404 页面

**方案**：创建主题一致的 404 页面，包含搜索框和推荐文章链接。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `app/not-found.tsx` | 新建，自定义 404 |

**设计**：
- 大标题 "404"
- 副标题 "页面未找到"
- 搜索框（跳转 archive 页）
- 返回首页 / Archive 链接
- 保持博客主题风格（深色 + prose-invert）

### 2.3 阅读进度条

**方案**：文章详情页顶部添加进度条，基于 scroll 位置。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/article/ReadingProgress.tsx` | 新建，Client Component |
| `app/article/[slug]/page.tsx` | 引入组件 |

**实现**：
```
┌─ 红色/primary 进度条 ──────────────────┐
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────────────────────────────┘
```
- `position: fixed, top: 0, z-index: 60`
- `useEffect` + `scroll` 事件监听
- `width = (scrollY / (docHeight - viewportHeight)) * 100%`
- 仅在 `/article/[slug]` 路由显示

### 2.4 回到顶部按钮

**方案**：页面右下角浮动按钮，滚动超过 300px 后显示。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/ui/BackToTop.tsx` | 新建，Client Component |
| `components/layout/ConditionalLayout.tsx` | 引入（所有非 standalone 页面） |

**实现**：
- 圆形按钮，ArrowUp 图标
- `fixed bottom-6 right-6`
- `opacity-0` → `opacity-100` 过渡（scroll > 300px 时显示）
- 点击 `window.scrollTo({ top: 0, behavior: 'smooth' })`
- 使用 `requestAnimationFrame` 节流 scroll 监听

---

## Phase 3：搜索与导航升级

### 3.1 Cmd+K 全局搜索

**方案**：基于 Pagefind 的搜索模态框，Cmd/Ctrl+K 全局唤起。

**当前状态**：Pagefind 已在 `postbuild` 中配置，但需要 UI 组件。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/search/SearchDialog.tsx` | 新建，搜索模态框 |
| `components/search/usePagefind.ts` | 新建，Pagefind hook |
| `components/layout/Header.tsx` | 添加搜索按钮/快捷键提示 |

**SearchDialog 设计**：
```
┌──────────────────────────────────────┐
│ 🔍 搜索文章...              ⌘K      │
├──────────────────────────────────────┤
│ [AI 快速学习指南]                      │
│ [Prompt 工程完全指南]                  │
│ [AI 编程新时代]                        │
│ ...                                   │
└──────────────────────────────────────┘
```

- 使用 `Dialog` 组件（已有）
- 加载 `/pagefind/pagefind.js`（构建后生成）
- 搜索结果展示：标题 + 分类标签 + 摘要片段
- 点击结果 → 跳转文章页
- ESC 或点击外部关闭

**usePagefind hook**：
```typescript
// 动态加载 pagefind
const pagefind = await import('/pagefind/pagefind.js');
const results = await pagefind.search(query);
```

### 3.2 标签聚合页

**方案**：`/tag/[slug]` 路由，按标签展示文章。

**当前状态**：`types/index.ts` 已有 tag 结构，`lib/blog-data.ts` 的 `getAllArticles()` 已返回 tags 数据。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `lib/blog-data.ts` | 添加 `getArticlesByTag()` + `getAllTags()` |
| `app/tag/[slug]/page.tsx` | 新建，标签文章列表页 |
| `components/article/ArticleListItem.tsx` | 标签可点击跳转 `/tag/[slug]` |
| `components/article/ArticleCard.tsx` | 标签可点击跳转 |

**`lib/blog-data.ts` 新增函数**：
```typescript
export async function getAllTags(): Promise<{ name: string; slug: string; count: number }[]>
export async function getArticlesByTag(tagSlug: string): Promise<Article[]>
```

**页面设计**：
- 顶部：标签名 + 文章数量
- 内容：ArticleGrid / ArticleListItem（复用现有组件）
- 底部：相关标签链接

---

## Phase 4：内容增强

### 4.1 相关文章算法优化

**当前**：仅按分类过滤，取前 3 篇。

**优化方案**：加权匹配（分类 + 标签 + 时效性）

```typescript
// scoring:
// - 同分类: +3
// - 每个共同标签: +2
// - 发布时间越近: +0~1（30天内满分）
// 排除当前文章，取 top 3
```

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `lib/blog-data.ts` | 重写 `getRelatedArticles()` |

### 4.2 图片灯箱

**方案**：点击文章中的图片 → 全屏遮罩层放大预览，点击关闭。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `components/article/ImageLightbox.tsx` | 新建，灯箱组件 |
| `components/article/ArticleContent.tsx` | 替换 img 渲染，绑定点击事件 |

**ImageLightbox 设计**：
- `fixed inset-0 z-[100]` 全屏遮罩
- 黑色半透明背景 `bg-black/90`
- 图片居中，`max-w-[90vw] max-h-[90vh] object-contain`
- 点击遮罩或按 ESC 关闭
- 图片缩放动画 `transition-transform`

**ArticleContent 修改**：
- `img` 组件包裹可点击容器
- 使用 `useState` 管理灯箱状态（当前图片 URL）
- 将 `useState` 提升到 `ArticleContent` 顶层

### 4.3 隐私政策 / 服务条款 / 收集声明页

**问题**：Footer 链接指向 `/privacy`、`/terms`、`/collection-notice`，但页面不存在。

**方案**：创建三个静态页面，内容为中文。

**涉及文件**：
| 文件 | 操作 |
|------|------|
| `app/privacy/page.tsx` | 新建 |
| `app/terms/page.tsx` | 新建 |
| `app/collection-notice/page.tsx` | 新建 |

**内容要点**（隐私政策）：
- 收集的信息类型（评论昵称/邮箱、浏览数据）
- 数据用途（改善内容、反垃圾）
- 第三方服务（Cloudflare、Resend）
- Cookie 使用说明
- 用户权利（删除数据联系邮箱）
- 最后更新日期

**内容要点**（服务条款）：
- 内容版权声明
- 用户评论规范
- 免责声明
- 外部链接

**内容要点**（收集声明）：
- 使用 Cloudflare 分析（匿名化 IP）
- 评论数据存储在 Cloudflare D1
- 邮件订阅通过 Resend 处理
- 不出售用户数据

---

## Phase 5：构建验证 & 清理

### 5.1 验证清单

```bash
pnpm build          # TypeScript 编译 + Next.js 构建
pnpm lint           # ESLint 检查
```

逐项验证：
- [ ] 移动端（375px）Header 汉堡菜单正常
- [ ] 文章页移动端 TOC 可折叠展开
- [ ] AboutMe 头像不溢出
- [ ] RSS `/feed.xml` 返回有效 XML
- [ ] 访问不存在页面显示自定义 404
- [ ] 文章页阅读进度条随滚动变化
- [ ] 回到顶部按钮滚动后出现
- [ ] Cmd+K 搜索模态框正常
- [ ] `/tag/ai` 标签页显示相关文章
- [ ] 相关文章推荐合理
- [ ] 文章图片可点击放大
- [ ] `/privacy` `/terms` `/collection-notice` 页面存在
- [ ] Footer 所有链接可访问

### 5.2 SEO 更新

| 文件 | 修改 |
|------|------|
| `app/sitemap.ts` | 添加 `/feed.xml` 和 `/tag/[slug]` 路径 |
| `app/layout.tsx` | 添加 RSS alternates |
| `lib/seo.ts` | 更新 `generateDefaultMetadata` 添加 RSS link |

### 5.3 Footer 订阅修复

**问题**：Footer 中的 `handleSubscribe` 仍调用 `NEXT_PUBLIC_STRAPI_API_URL`（已废弃的 Strapi 后端）。

**修复**：改为调用 `/api/subscribe`（已有 route handler）。

| 文件 | 操作 |
|------|------|
| `components/layout/Footer.tsx` | 修改 `handleSubscribe` 的 fetch URL |

---

## 文件变更汇总

### 新建文件（13个）
```
app/feed.xml/route.ts                    # RSS feed
app/not-found.tsx                        # 404 页面
app/privacy/page.tsx                     # 隐私政策
app/terms/page.tsx                       # 服务条款
app/collection-notice/page.tsx           # 收集声明
app/tag/[slug]/page.tsx                  # 标签聚合页
components/layout/MobileNav.tsx          # 移动端导航
components/article/MobileToc.tsx         # 移动端目录
components/article/ReadingProgress.tsx   # 阅读进度条
components/ui/BackToTop.tsx             # 回到顶部
components/search/SearchDialog.tsx       # 搜索模态框
components/search/usePagefind.ts         # Pagefind hook
components/article/ImageLightbox.tsx     # 图片灯箱
```

### 修改文件（11个）
```
components/layout/Header.tsx             # 移动菜单 + 搜索按钮
components/layout/Footer.tsx             # 修复订阅 API
components/layout/ConditionalLayout.tsx  # 引入 BackToTop
components/home/AboutMe.tsx              # 响应式头像
components/article/ArticleContent.tsx    # 响应式标题 + 图片灯箱
components/article/ArticleCard.tsx       # 移动端互动数据
components/article/ArticleListItem.tsx   # 移动端分享按钮
components/article/ArticlesSection.tsx   # 隐藏小屏 LayoutToggle
components/article/CategoryArticlesSection.tsx  # 同上
components/article/TableOfContents.tsx   # （无改动，保持侧边栏）
app/article/[slug]/page.tsx             # 进度条 + 移动端 TOC
```

### 数据层修改（2个）
```
lib/blog-data.ts                         # getArticlesByTag + getAllTags + 优化 getRelatedArticles
app/sitemap.ts                           # 添加标签页路径
```

---

## 依赖确认

**无需安装新 npm 包**。所有功能基于现有依赖实现：
- shadcn/ui：Sheet, Dialog, Collapsible, Button, Input, Card（已安装）
- Lucide React：Menu, Search, ArrowUp, X（已安装）
- Pagefind：已在 postbuild 中配置
- 原生 CSS：进度条、灯箱动画

---

## 实施顺序建议

```
第 1 次会话：Phase 1（移动端适配）— 影响最广，优先完成
第 2 次会话：Phase 2（基础体验）— RSS + 404 + 进度条 + 回到顶部
第 3 次会话：Phase 3 + Phase 4（搜索/标签 + 内容增强）— 功能性升级
第 4 次会话：Phase 5（验证 + 清理）— 确保质量
```
