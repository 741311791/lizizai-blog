# 每日 AI 资讯 — 设计文档

> 状态：开发完成 | 日期：2026-04-21

---

## 1. 功能概述

在博客首页新增「每日 AI 资讯」模块，展示外部服务每天自动采集的 AI 行业资讯（GitHub 趋势、行业动态等）。用户可在首页快速浏览当日 AI 动态，也可进入归档页面按日期浏览历史资讯。

### 核心流程

```
外部服务采集 → 直接写入 D1 → Next.js ISR 读取 → 首页 + 归档页渲染
```

### 职责边界

| 职责 | 负责方 |
|------|--------|
| 数据采集 & 写入 D1 | 外部服务（机器人） |
| D1 表结构定义 | 本项目（本文档） |
| 数据读取 & 展示 | 本项目 |
| 兜底 & 降级策略 | 本项目 |

本项目**不实现写入接口**，仅负责读取和展示。

---

## 2. 数据库表结构设计

### 2.1 主表：`ai_news`

使用现有 Cloudflare D1 实例（与 cf-comment 等共用），在其中新建此表。

```sql
CREATE TABLE IF NOT EXISTS ai_news (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT    NOT NULL,                        -- 资讯日期，格式 YYYY-MM-DD
  title        TEXT    NOT NULL,                        -- 资讯标题
  summary      TEXT    NOT NULL DEFAULT '',             -- 资讯摘要（100-300 字）
  cover_url    TEXT    NOT NULL DEFAULT '',             -- 封面图 URL（可为空）
  tags         TEXT    NOT NULL DEFAULT '[]',           -- 标签 JSON 数组，如 ["llm","open-source"]
  source_name  TEXT    NOT NULL DEFAULT '',             -- 来源名称，如 "GitHub"、"TechCrunch"
  source_url   TEXT    NOT NULL DEFAULT '',             -- 原文链接
  importance   INTEGER NOT NULL DEFAULT 0,              -- 重要度 0=普通 1=重要 2=头条
  sort_order   INTEGER NOT NULL DEFAULT 0,              -- 同日内排序权重，越大越靠前
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 按日期查询（最核心查询路径）
CREATE INDEX IF NOT EXISTS idx_ai_news_date ON ai_news(date DESC);
-- 按重要度排序
CREATE INDEX IF NOT EXISTS idx_ai_news_importance ON ai_news(date, importance DESC);
```

### 2.2 标签设计：JSON 数组

`tags` 字段存储 JSON 数组字符串，一条资讯可以有多个标签：

```json
// 示例数据
{ "tags": "[\"llm\", \"open-source\"]" }
{ "tags": "[\"product\"]" }
{ "tags": "[\"research\", \"industry\"]" }
```

**写入示例**（外部服务）：
```json
{
  "title": "Meta 开源 LLaMA 4",
  "tags": ["open-source", "llm"],
  "importance": 2
}
```

**读取查询**（按标签筛选）：
```sql
-- 查询包含 "llm" 标签的资讯（利用 SQLite json_each）
SELECT * FROM ai_news, json_each(tags)
WHERE date = '2026-04-21' AND json_each.value = 'llm'
ORDER BY importance DESC, sort_order DESC;
```

### 2.3 标签参考值（不硬编码）

以下为外部服务写入时可使用的标签参考，前端不硬编码，动态渲染传入的标签值：

| 标签值        | 中文标签   | 说明               | 渐变色兜底                       | 图标          |
|-------------|-----------|--------------------|----------------------------------|---------------|
| `llm`       | 大模型    | GPT、Claude 等     | `from-blue-700 to-indigo-800`    | `Brain`       |
| `product`   | 产品发布  | 新产品/功能        | `from-emerald-700 to-teal-800`   | `Rocket`      |
| `research`  | 学术研究  | 论文/研究突破      | `from-purple-700 to-violet-800`  | `FlaskConical` |
| `industry`  | 行业动态  | 融资/人事/政策     | `from-amber-700 to-orange-800`   | `TrendingUp`  |
| `open-source` | 开源项目 | GitHub 趋势等     | `from-orange-700 to-red-800`     | `GitBranch`   |
| `general`   | 综合      | 默认               | `from-slate-700 to-slate-800`    | `Newspaper`   |

前端维护一个 `tagVisualMap`，遇到未映射的标签统一使用 `general` 的兜底样式。标签色参考：

| 标签          | 标签色                                |
|--------------|---------------------------------------|
| `llm`        | `bg-blue-500/15 text-blue-400`        |
| `product`    | `bg-green-500/15 text-green-400`      |
| `research`   | `bg-purple-500/15 text-purple-400`    |
| `industry`   | `bg-yellow-500/15 text-yellow-400`    |
| `open-source` | `bg-orange-500/15 text-orange-400`   |
| `general`    | `bg-gray-500/15 text-gray-400`        |
| 其他（兜底）  | `bg-gray-500/15 text-gray-400`        |

### 2.4 设计决策说明

| 决策 | 原因 |
|------|------|
| 使用 D1 而非 R2 | 资讯需要按日期/标签查询，D1 的 SQL 能力更合适 |
| `date` 用 TEXT 类型 | D1 的日期函数兼容性好，ISO 格式字符串排序天然正确 |
| `tags` 用 JSON 数组而非关联表 | D1（SQLite）原生支持 `json_each`，数据量级下无需拆关联表；写入简单，读取灵活 |
| 标签不硬编码 | 外部服务可自由新增标签，前端按已知映射渲染、未知标签兜底处理 |
| 保留 `importance` + `sort_order` | 双重排序：importance 决定展示层级，sort_order 决定同级内顺序 |
| `cover_url` 允许为空 | 部分资讯无天然封面图，由前端兜底处理 |
| 共用现有 D1 实例 | 减少管理开销，D1 存储成本低 |
| 不主动清理历史数据 | 积累后作为归档页面的数据基础 |

---

## 3. 封面图策略

### 3.1 字段定义

```typescript
cover_url: string  // 封面图 URL，可为空字符串
```

外部服务写入时：
- **有封面图**：`cover_url` 填入图片完整 URL（建议存储到 R2 或 CDN）
- **无封面图**：`cover_url` 设为空字符串 `""`

### 3.2 展示兜底策略

前端根据 `cover_url` 是否为空，采用不同展示方式：

```
判断 cover_url
  ├─ 有值 → 展示实际封面图
  └─ 空值 → 兜底：取第一个标签的主题渐变色块 + 标签图标
```

兜底规则：取 `tags[0]`（第一个标签）作为主题色依据，未命中映射则用 `general` 兜底。

#### 兜底视觉方案

```
┌────────────────────┐
│                    │
│     渐变色背景      │   ← 取 tags[0] 对应的渐变色
│                    │
│        🧠          │   ← tags[0] 对应的图标，opacity-30，居中
│                    │
│                    │
└────────────────────┘
```

- 渐变色块与有封面图的卡片保持相同尺寸（16:9 比例）
- 图标使用 lucide-react，尺寸 `w-8 h-8`，`text-white/30`
- 无图和有图卡片混排时视觉统一，不会出现空白或错位

---

## 4. API 接口设计（仅读取）

### 4.1 获取资讯列表

```
GET /api/ai-news?date=YYYY-MM-DD&tag=llm&limit=10&offset=0
```

**参数：**

| 参数      | 必填 | 默认值     | 说明                                    |
|----------|------|-----------|-----------------------------------------|
| `date`   | 否   | 当天日期   | 指定日期，格式 YYYY-MM-DD               |
| `tag`    | 否   | 全部       | 按标签筛选（匹配 tags 数组中包含该值的） |
| `limit`  | 否   | 20        | 最大返回条数，上限 50                   |
| `offset` | 否   | 0         | 分页偏移量                              |

**成功响应：**

```json
{
  "ok": true,
  "data": {
    "date": "2026-04-21",
    "items": [
      {
        "id": 1,
        "title": "Claude 5 正式发布",
        "summary": "Anthropic 今日正式发布...",
        "cover_url": "https://r2.example.com/...",
        "tags": ["llm", "product"],
        "source_name": "Anthropic Blog",
        "source_url": "https://...",
        "importance": 2,
        "created_at": "2026-04-21T08:00:00Z"
      }
    ],
    "total": 8,
    "has_more": false
  }
}
```

**按标签筛选的 SQL 实现：**

```sql
-- 无标签筛选
SELECT * FROM ai_news WHERE date = ? ORDER BY importance DESC, sort_order DESC LIMIT ? OFFSET ?;

-- 有标签筛选（利用 json_each）
SELECT DISTINCT ai_news.*
FROM ai_news, json_each(ai_news.tags)
WHERE ai_news.date = ? AND json_each.value = ?
ORDER BY ai_news.importance DESC, ai_news.sort_order DESC
LIMIT ? OFFSET ?;
```

### 4.2 获取可用日期列表（归档页用）

```
GET /api/ai-news/dates?limit=30
```

**响应：**

```json
{
  "ok": true,
  "data": {
    "dates": ["2026-04-21", "2026-04-20", "2026-04-19"]
  }
}
```

SQL：`SELECT DISTINCT date FROM ai_news ORDER BY date DESC LIMIT ?`

---

## 5. 数据获取与兜底策略

### 5.1 数据获取流程

```
首页渲染
  ├─ 场景 A：当日有数据 → 正常展示
  ├─ 场景 B：当日无数据（机器人尚未推送）→ 回退到最近一个有数据的日期
  ├─ 场景 C：D1 查询失败 → 静默降级，不展示该模块
  └─ 场景 D：所有数据为空 → 模块整体隐藏
```

### 5.2 兜底逻辑（伪代码）

```typescript
async function getDailyNews(targetDate?: string, tag?: string) {
  try {
    // 1. 优先查询指定日期
    const date = targetDate || getTodayDateString();
    let items = await queryD1(date, tag);

    // 2. 当日无数据，回退到最近 7 天
    if (items.length === 0) {
      const recent = await queryRecentD1(date, 7, tag);
      if (recent.length > 0) {
        return { items: recent, date: recent[0].date, isFallback: true };
      }
    }

    // 3. 完全无数据
    if (items.length === 0) {
      return { items: [], date: null, isEmpty: true };
    }

    return { items, date, isFallback: false };
  } catch (error) {
    // 4. D1 异常，静默降级
    console.error('[ai-news] D1 query failed:', error);
    return { items: [], date: null, isError: true };
  }
}
```

### 5.3 缓存策略

| 层级 | 策略 | 说明 |
|------|------|------|
| ISR 页面级 | `revalidate: 1800`（30分钟） | 首页资讯模块可独立控制 |
| API Route 级 | `next: { revalidate: 900 }` | 15 分钟缓存，平衡时效性和性能 |
| 客户端 | 不缓存 | 资讯模块作为 Server Component 渲染 |

---

## 6. 页面 UI/UX 设计

### 6.1 首页模块位置

在首页 Stats Bar 和 ArticlesSection **之间**插入：

```
Hero                    ← 品牌展示
PopularArticles         ← 热门文章
Stats Bar               ← 统计数据
[每日 AI 资讯]          ← ★ 新增模块
ArticlesSection         ← 文章列表
AboutMe                 ← 关于我
```

### 6.2 首页模块布局（桌面端）

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ☀ AI 日报 · 2026年4月21日                           查看全部 →    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────┐                                                  │   │
│  │ │ 封面图   │  ★ Claude 5 正式发布，多模态能力全面升级         │   │
│  │ │ 或渐变色 │  Anthropic 今日正式发布 Claude 5 模型，支持...   │   │
│  │ │ 块      │  Anthropic Blog · [大模型] [开源] → 原文         │   │
│  │ └─────────┘                                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │    │
│  │ │ 封面图/渐变  │ │ │ │ 封面图/渐变  │ │ │ │ 封面图/渐变  │ │    │
│  │ │   🧠        │ │ │ │   🚀        │ │ │ │   🔬        │ │    │
│  │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │    │
│  │ OpenAI 推出       │ │ Google DeepMind  │ │ Meta 开源        │    │
│  │ 新搜索产品        │ │ 发布最新论文     │ │ LLaMA 4          │    │
│  │ TechCrunch       │ │ Nature           │ │ GitHub           │    │
│  │ · [产品] [搜索]  │ │ · [研究]         │ │ · [开源] [大模型] │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 首页模块布局（移动端）

```
┌───────────────────────┐
│ ☀ AI 日报 · 4月21日   │
│              全部 →    │
│                       │
│ ┌───────────────────┐ │
│ │ ┌────┐            │ │
│ │ │封面 │ ★ [头条]  │ │
│ │ │图  │ Claude 5   │ │
│ │ └────┘ 正式发布   │ │
│ │ [大模型] [开源]    │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ ┌──────────────┐  │ │
│ │ │  🧠 渐变色块  │  │ │
│ │ └──────────────┘  │ │
│ │ OpenAI 推出新搜索  │ │
│ │ TechCrunch         │ │
│ │ [产品] [搜索]      │ │
│ └───────────────────┘ │
│        ...更多         │
└───────────────────────┘
```

### 6.4 组件层级

```
components/home/DailyNews.tsx            ← 首页模块主容器（Server Component）
├── DailyNewsHeader                      ← 标题栏（日期 + "查看全部"链接）
├── DailyNewsFeatured                    ← 头条卡片（importance=2，带封面图）
├── DailyNewsGrid                        ← 资讯网格
│   └── DailyNewsCard                    ← 单条资讯卡片（含封面图兜底）
└── [return null]                        ← 空数据时整体隐藏
```

### 6.5 交互细节

#### 头条卡片（importance = 2）

- **布局**：水平排列，左侧封面图（固定宽度），右侧内容区
- **封面图区域**：宽高比 16:9，有图显示图片，无图显示 `tags[0]` 渐变色块 + 图标
- **内容区**：标题（单行）+ 摘要（2行截断）+ 来源 + 标签列表
- **左侧竖线**：`border-l-4 border-accent` 强调色
- **点击**：跳转 `source_url`，新窗口打开

#### 普通卡片（importance ≤ 1）

- **网格**：桌面 3 列，平板 2 列，移动 1 列
- **卡片结构**：
  1. 顶部封面图区域（16:9，有图显示图片，无图显示 `tags[0]` 渐变色块 + 图标）
  2. 标题（2行截断）
  3. 底部信息：来源名称 + 标签列表
- **Hover**：卡片微微上移 + 阴影加深（与现有 PopularArticles 一致）
- **点击**：新窗口跳转原文

#### 标签展示

- 每条资讯可展示**多个标签**，横向排列
- 小型圆角标签（`px-2 py-0.5 rounded-full text-xs`）
- 最多展示 3 个，超出部分显示 `+N`
- 标签可点击，跳转到归档页并按该标签筛选（`/ai-news?tag=llm`）

#### 空状态

当资讯为空时，模块**整体隐藏**（`return null`），不展示空状态占位。

#### 回退日期提示

当展示非当日数据时，标题栏显示实际日期，不加额外提示：

```
☀ AI 日报 · 2026年4月20日
```

### 6.6 归档页面

**路由**：`/[locale]/ai-news`

一期实现，按日期浏览历史资讯，支持通过 URL 参数按标签筛选。

#### 页面布局

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ☀ AI 资讯归档                                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  日期选择器：[ 4/21 ] [ 4/20 ] [ 4/19 ] [ 4/18 ] ...   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ┌─────────┐  ★ Claude 5 正式发布                        │   │
│  │ │ 封面图   │  Anthropic 今日正式发布 Claude 5...         │   │
│  │ └─────────┘  Anthropic Blog · [大模型] [开源] · 4月21日  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ [封面/渐变]  │  │ [封面/渐变]  │  │ [封面/渐变]  │          │
│  │ OpenAI ...   │  │ DeepMind ... │  │ Meta ...     │          │
│  │ TechCrunch   │  │ Nature       │  │ GitHub       │          │
│  │ [产品] [搜索]│  │ [研究]       │  │ [开源]       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  [加载更多]                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 交互细节

- **日期选择器**：横向滚动的日期胶囊，选中态高亮（`bg-accent text-accent-foreground`）
  - 桌面端显示最近 14 天，可左右滚动
  - 移动端横向滚动，snap 对齐
- **标签筛选**：不提供前端 UI 筛选器，通过 URL 参数 `?tag=llm` 实现
  - 用户在首页/归档页点击资讯上的标签 → 跳转到 `/ai-news?tag=llm`
  - 页面读取 URL 参数，传给 API 做筛选
- **资讯列表**：
  - 头条（importance=2）：全宽水平布局，与首页一致
  - 普通资讯：3 列网格（桌面）/ 1 列（移动），与首页一致
  - 每条显示发布日期（`date` 字段）
- **分页**：底部的"加载更多"按钮，每次加载 12 条
- **URL 参数**：`/ai-news?date=2026-04-21&tag=open-source`，支持直接链接分享
- **SEO**：ISR 静态生成，`revalidate: 3600`

#### 组件层级

```
app/[locale]/ai-news/page.tsx           ← 归档页面（Server Component）
├── AiNewsDateSelector                  ← 日期选择器（Client Component）
├── AiNewsList                          ← 资讯列表
│   ├── DailyNewsFeatured               ← 复用头条卡片
│   └── DailyNewsCard                   ← 复用普通卡片
└── LoadMoreButton                      ← 加载更多（Client Component）
```

---

## 7. 文件变更清单（预估）

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 新增 | `lib/ai-news.ts` | 数据获取层（D1 查询 + 兜底逻辑） |
| 新增 | `app/api/ai-news/route.ts` | 公开 GET 接口（列表） |
| 新增 | `app/api/ai-news/dates/route.ts` | 公开 GET 接口（日期列表） |
| 新增 | `components/home/DailyNews.tsx` | 首页资讯模块 |
| 新增 | `components/ai-news/DailyNewsCard.tsx` | 资讯卡片（含封面图兜底） |
| 新增 | `components/ai-news/DailyNewsFeatured.tsx` | 头条卡片 |
| 新增 | `components/ai-news/AiNewsDateSelector.tsx` | 日期选择器 |
| 新增 | `app/[locale]/ai-news/page.tsx` | 归档页面 |
| 新增 | `lib/tag-visuals.ts` | 标签视觉映射（渐变色、图标、标签色） |
| 修改 | `app/[locale]/page.tsx` | 引入 DailyNews 组件 |
| 修改 | `lib/env.ts` | 新增 D1 绑定配置（如需要） |
| 修改 | `types/index.ts` | 新增 AiNews 类型定义 |
| 修改 | `components/layout/Header.tsx` | 导航栏新增"AI 资讯"入口（可选） |

---

## 8. 与现有架构的一致性

| 维度 | 现有模式 | 资讯模块 |
|------|---------|---------|
| 数据库 | Cloudflare D1（评论/点赞/浏览） | Cloudflare D1 共用实例 |
| 数据获取 | Server Component + ISR | Server Component + ISR |
| 错误处理 | try-catch + 静默降级 | try-catch + 静默降级 |
| 组件风格 | shadcn/ui + Tailwind | shadcn/ui + Tailwind |
| 深色模式 | 仅深色 | 仅深色 |
| 语言 | 中文 UI + 中文注释 | 中文 UI + 中文注释 |
