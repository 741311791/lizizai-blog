# 每日 AI 资讯 — 设计文档

> 状态：设计中 | 日期：2026-04-21

---

## 1. 功能概述

在博客首页新增「每日 AI 资讯」模块，展示由机器人每天自动推送的 AI 行业资讯。用户可在首页快速浏览当日 AI 动态，点击可查看资讯详情。

### 核心流程

```
机器人每日推送 → Cloudflare D1 写入 → Next.js ISR 读取 → 首页渲染
```

---

## 2. 数据库表结构设计

### 2.1 主表：`ai_news`

```sql
CREATE TABLE IF NOT EXISTS ai_news (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT    NOT NULL,           -- 资讯日期，格式 YYYY-MM-DD，如 "2026-04-21"
  title       TEXT    NOT NULL,           -- 资讯标题
  summary     TEXT    NOT NULL,           -- 资讯摘要（100-300 字）
  source_name TEXT    NOT NULL DEFAULT '',-- 来源名称，如 "TechCrunch"、"量子位"
  source_url  TEXT    NOT NULL DEFAULT '',-- 原文链接
  category    TEXT    NOT NULL DEFAULT 'general', -- 分类标签
  importance  INTEGER NOT NULL DEFAULT 0, -- 重要度权重，0=普通 1=重要 2=头条
  sort_order  INTEGER NOT NULL DEFAULT 0, -- 同日内的排序权重，越大越靠前
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 按日期查询索引（最核心的查询路径）
CREATE INDEX IF NOT EXISTS idx_ai_news_date ON ai_news(date DESC);
-- 按分类筛选
CREATE INDEX IF NOT EXISTS idx_ai_news_category ON ai_news(category);
-- 按重要度排序
CREATE INDEX IF NOT EXISTS idx_ai_news_importance ON ai_news(date, importance DESC);
```

### 2.2 分类枚举

| category 值   | 中文标签   | 说明           |
|---------------|-----------|----------------|
| `general`     | 综合动态   | 默认分类       |
| `llm`         | 大模型     | GPT、Claude 等 |
| `product`     | 产品发布   | 新产品/功能    |
| `research`    | 学术研究   | 论文/研究突破  |
| `industry`    | 行业动态   | 融资/人事/政策 |
| `open-source` | 开源项目   | 开源模型/工具  |

### 2.3 数据写入示例（机器人推送）

```json
POST /api/admin/ai-news
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-04-21",
  "items": [
    {
      "title": "Anthropic 发布 Claude 5",
      "summary": "Anthropic 今日正式发布 Claude 5 模型...",
      "source_name": "Anthropic Blog",
      "source_url": "https://...",
      "category": "llm",
      "importance": 2,
      "sort_order": 100
    }
  ]
}
```

### 2.4 设计决策说明

| 决策 | 原因 |
|------|------|
| 使用 D1 而非 R2 | 资讯需要按日期/分类查询，D1 的 SQL 能力更合适 |
| `date` 用 TEXT 类型 | D1 的日期函数兼容性好，ISO 格式字符串排序天然正确 |
| 保留 `importance` + `sort_order` | 双重排序：importance 决定展示层级，sort_order 决定同级内顺序 |
| 不做关联表 | 资讯结构扁平，无需关系映射，保持简单 |

---

## 3. API 接口设计

### 3.1 公开接口：获取资讯列表

```
GET /api/ai-news?date=YYYY-MM-DD&category=llm&limit=10
```

**参数：**

| 参数     | 必填 | 默认值       | 说明                          |
|----------|------|-------------|-------------------------------|
| `date`   | 否   | 当天日期     | 指定日期，格式 YYYY-MM-DD     |
| `category` | 否 | 全部         | 按分类筛选                    |
| `limit`  | 否   | 20          | 最大返回条数，上限 50         |

**成功响应：**

```json
{
  "ok": true,
  "data": {
    "date": "2026-04-21",
    "items": [
      {
        "id": 1,
        "title": "...",
        "summary": "...",
        "source_name": "TechCrunch",
        "source_url": "https://...",
        "category": "llm",
        "importance": 2
      }
    ],
    "total": 8,
    "has_more": false
  }
}
```

### 3.2 管理接口：批量写入资讯

```
POST /api/admin/ai-news
Authorization: Bearer <NEXT_PUBLIC_SYNC_TOKEN>
```

请求体见 2.3 节。响应：

```json
{
  "ok": true,
  "inserted": 8,
  "date": "2026-04-21"
}
```

**幂等策略**：同一 `date` 的数据，先 DELETE 再 INSERT，保证机器人重复推送不会产生重复数据。

### 3.3 管理接口：清空指定日期资讯

```
DELETE /api/admin/ai-news?date=YYYY-MM-DD
Authorization: Bearer <NEXT_PUBLIC_SYNC_TOKEN>
```

---

## 4. 数据获取与兜底策略

### 4.1 数据获取流程

```
首页渲染
  ├─ 场景 A：当日有数据 → 正常展示
  ├─ 场景 B：当日无数据（机器人尚未推送）→ 回退到最近一个有数据的日期
  ├─ 场景 C：D1 查询失败 → 静默降级，不展示该模块
  └─ 场景 D：所有数据为空 → 模块整体隐藏
```

### 4.2 兜底逻辑（伪代码）

```typescript
async function getDailyNews(targetDate?: string) {
  try {
    // 1. 优先查询指定日期
    const date = targetDate || getTodayDateString(); // "2026-04-21"
    let items = await queryD1(date);

    // 2. 当日无数据，回退到最近7天
    if (items.length === 0) {
      const recent = await queryRecentD1(date, 7);
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

### 4.3 缓存策略

| 层级 | 策略 | 说明 |
|------|------|------|
| ISR 页面级 | `revalidate: 1800`（30分钟） | 首页已有 3600 缓存，资讯模块可独立控制 |
| API Route 级 | `next: { revalidate: 900 }` | 15 分钟缓存，平衡时效性和性能 |
| 客户端 | 不缓存 | 资讯模块作为 Server Component 渲染 |

### 4.4 写入后缓存刷新

机器人推送成功后，主动调用 ISR revalidate 路径清除首页缓存（与现有同步流程一致）：

```
POST https://<NEXT_PUBLIC_SITE_URL>/api/revalidate
```

---

## 5. 页面 UI/UX 设计

### 5.1 模块位置

在首页 Stats Bar 和 ArticlesSection **之间**插入，作为独立 Section：

```
Hero                    ← 品牌展示
PopularArticles         ← 热门文章
Stats Bar               ← 统计数据
[每日 AI 资讯]          ← ★ 新增模块
ArticlesSection         ← 文章列表
AboutMe                 ← 关于我
```

**理由**：资讯是时效性内容，放在内容区域上方可以最大化曝光，但不应抢占 Hero/热门文章的核心位置。

### 5.2 模块布局（桌面端）

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ☀ AI 日报 · 2026年4月21日                         查看全部 →  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ★  [头条] Claude 5 正式发布，多模态能力全面升级          │    │
│  │    Anthropic Blog · 大模型 · 2小时前                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ OpenAI 推出   │  │ Google DeepMind│  │ Meta 开源    │          │
│  │ 新搜索产品    │  │ 发布最新论文   │  │ LLaMA 4      │          │
│  │              │  │              │  │              │          │
│  │ TechCrunch   │  │ Nature       │  │ GitHub       │          │
│  │ · 产品发布   │  │ · 学术研究   │  │ · 开源项目   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 字节跳动 AI   │  │ AI 芯片市场   │  │ ...更多      │          │
│  │ 战略升级      │  │ Q1 报告      │  │              │          │
│  │              │  │              │  │              │          │
│  │ 36Kr        │  │ Reuters      │  │              │          │
│  │ · 行业动态   │  │ · 行业动态   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 模块布局（移动端）

```
┌───────────────────────┐
│ ☀ AI 日报 · 4月21日   │
│              全部 →    │
│                       │
│ ┌───────────────────┐ │
│ │ ★ [头条]          │ │
│ │ Claude 5 正式发布  │ │
│ │ Anthropic · 大模型 │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ OpenAI 推出新搜索  │ │
│ │ TechCrunch · 产品  │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ Google DeepMind   │ │
│ │ Nature · 学术研究  │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ Meta 开源 LLaMA 4 │ │
│ │ GitHub · 开源项目  │ │
│ └───────────────────┘ │
│        ...更多         │
└───────────────────────┘
```

### 5.4 组件层级

```
components/home/DailyNews.tsx          ← 主容器（Server Component）
├── DailyNewsHeader                    ← 标题栏（日期 + "查看全部"）
├── DailyNewsFeatured                  ← 头条卡片（importance=2）
├── DailyNewsGrid                      ← 资讯网格
│   └── DailyNewsCard                  ← 单条资讯卡片
└── DailyNewsEmpty                     ← 空状态占位（可选）
```

### 5.5 交互细节

#### 头条卡片（importance = 2）

- **宽度**：满宽，与容器等宽
- **视觉区分**：左侧竖线强调色（`border-l-4 border-accent`）
- **内容**：标题 + 摘要（2行截断）+ 来源 + 分类标签 + 原文链接
- **点击**：点击跳转 `source_url`，新窗口打开

#### 普通卡片（importance ≤ 1）

- **网格**：桌面 3 列，平板 2 列，移动 1 列
- **内容**：标题（2行截断）+ 来源名称 + 分类标签
- **Hover**：卡片微微上移 + 阴影加深（与现有 PopularArticles 一致）
- **点击**：同上，新窗口跳转原文

#### 分类标签

- 小型圆角标签（`px-2 py-0.5 rounded-full text-xs`）
- 使用现有 Tailwind 色彩体系，不同分类对应不同颜色
- 样式参考：

| category     | 标签色            |
|-------------|-------------------|
| `llm`       | `bg-blue-500/15 text-blue-400` |
| `product`   | `bg-green-500/15 text-green-400` |
| `research`  | `bg-purple-500/15 text-purple-400` |
| `industry`  | `bg-yellow-500/15 text-yellow-400` |
| `open-source` | `bg-orange-500/15 text-orange-400` |
| `general`   | `bg-gray-500/15 text-gray-400` |

#### 空状态

当资讯为空时，模块**整体隐藏**（`return null`），不展示空状态占位。这与项目现有风格一致——没有内容时不留空白。

#### 回退日期提示

当展示非当日数据时，标题栏显示实际日期并标注：

```
☀ AI 日报 · 2026年4月20日
```

不加额外"历史数据"提示，避免增加用户认知负担。

### 5.6 查看全部页面（可选，二期）

路由：`/ai-news` 或 `/[locale]/ai-news`

展示资讯归档列表，支持按日期/分类筛选。一期暂不实现，标题栏的"查看全部"链接预留，点击暂不做跳转。

---

## 6. 文件变更清单（预估）

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 新增 | `lib/ai-news.ts` | 数据获取层（D1 查询 + 兜底逻辑） |
| 新增 | `app/api/ai-news/route.ts` | 公开 GET 接口 |
| 新增 | `app/api/admin/ai-news/route.ts` | 管理 POST/DELETE 接口 |
| 新增 | `components/home/DailyNews.tsx` | 首页资讯模块 |
| 修改 | `app/[locale]/page.tsx` | 引入 DailyNews 组件 |
| 修改 | `lib/env.ts` | 新增 D1 连接相关配置（如需要） |
| 修改 | `types/index.ts` | 新增 AiNews 类型定义 |

---

## 7. 与现有架构的一致性

| 维度 | 现有模式 | 资讯模块 |
|------|---------|---------|
| 数据库 | Cloudflare D1（评论/点赞/浏览） | Cloudflare D1（资讯） |
| 数据获取 | Server Component + ISR | Server Component + ISR |
| 错误处理 | try-catch + 静默降级 | try-catch + 静默降级 |
| API 鉴权 | SYNC_TOKEN | 复用 SYNC_TOKEN |
| 组件风格 | shadcn/ui + Tailwind | shadcn/ui + Tailwind |
| 语言 | 中文 UI + 中文注释 | 中文 UI + 中文注释 |

---

## 8. 待确认事项

1. **D1 绑定方式**：是复用现有 D1 实例（cf-comment 那个）创建新表，还是新建独立 D1 实例？建议共用，减少管理开销。
2. **机器人推送协议**：批量推送还是单条推送？建议批量（见 2.3 节设计），减少请求次数。
3. **历史数据保留**：D1 存储成本低，建议不主动清理，积累后可作为"AI 资讯归档"功能的数据基础。
4. **查看全部页面**：是否一期实现 `/ai-news` 归档页面？
