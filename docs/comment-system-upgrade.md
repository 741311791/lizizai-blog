# 评论系统升级方案

## Context

当前评论系统使用 cf-comment 的 iframe 嵌入，UI 粗糙且没有用户身份系统（无昵称、无头像）。需要：
- 访客评论后自动分配昵称 + 随机头像
- 同一浏览器会话内身份保持一致
- 支持在原评论下进行嵌套回复
- 评论 UI 美观，与博客整体风格统一

## 方案概述

三步改造：
1. cf-comment 后端：D1 表加 nickname/avatar_url 字段，API 支持传入返回
2. 前端：用原生 React 组件替代 iframe，集成名字生成器 + DiceBear 头像 + 嵌套回复
3. 身份持久化：localStorage 存储访客身份

---

## Step 1: 修改 cf-comment 后端

### 1a. D1 数据库迁移

给 comments 表添加两个字段：

```sql
ALTER TABLE comments ADD COLUMN nickname TEXT DEFAULT '';
ALTER TABLE comments ADD COLUMN avatar_url TEXT DEFAULT '';
```

### 1b. 修改 handlePostComment (POST /area/{key}/comment)

- 从 FormData 中提取 nickname 和 avatar_url
- 写入 INSERT 语句

当前代码（worker.js 约第 2022 行）：

```sql
INSERT INTO comments (area_key, content, parent_id, hidden, likes, pinned) VALUES (?, ?, ?, 0, 0, 0)
```

改为：

```sql
INSERT INTO comments (area_key, content, parent_id, hidden, likes, pinned, nickname, avatar_url) VALUES (?, ?, ?, 0, 0, 0, ?, ?)
```

### 1c. 修改 handleGetComments (GET /area/{key}/comments)

- SELECT 查询添加 nickname, avatar_url 字段
- JSON 响应中包含这两个字段

当前代码（worker.js 约第 1963 行）：

```sql
SELECT id, content, parent_id, created_at, hidden, likes, pinned
```

改为：

```sql
SELECT id, content, parent_id, created_at, hidden, likes, pinned, nickname, avatar_url
```

### 1d. 部署

```bash
wrangler deploy
```

**涉及文件：**
- `/private/tmp/cf-services/cf-comment/worker.js`

---

## Step 2: 创建前端基础设施

### 2a. 安装依赖

```bash
pnpm add react-markdown
```

### 2b. 名字生成器 `lib/wuxia-names.ts`

- 使用 npm 包 `random_chinese_fantasy_names` 的 `generatePersonName()` 方法
- 同时内置一个通用网名列表作为 fallback
- `generateGuestNickname(seed: string): string` — 根据种子确定性生成昵称
- 种子来自 `crypto.randomUUID()`，首次访问时存入 localStorage
- `random_chinese_fantasy_names` 生成武侠风格人名（复姓 + 名），如"慕容无痕"、"独孤听雨"

### 2c. DiceBear 头像

- 无需安装依赖，直接使用 URL：
  - `https://api.dicebear.com/9.x/adventurer/svg?seed={seed}`
- adventurer 风格有武侠冒险感，支持深色背景
- 同一 seed 始终生成同一头像

### 2d. 访客身份管理 `lib/guest-identity.ts`

```typescript
interface GuestIdentity {
  id: string        // crypto.randomUUID()
  nickname: string  // generateGuestNickname(id)
  avatarUrl: string // DiceBear URL with id as seed
}

const GUEST_ID_KEY = 'lizizai_guest_id';

export function getOrCreateGuestIdentity(): GuestIdentity {
  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) return JSON.parse(existing);

  const id = crypto.randomUUID();
  const identity: GuestIdentity = {
    id,
    nickname: generateGuestNickname(id),
    avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(id)}`,
  };
  localStorage.setItem(GUEST_ID_KEY, JSON.stringify(identity));
  return identity;
}
```

**涉及文件：**
- 新建 `lib/wuxia-names.ts`
- 新建 `lib/guest-identity.ts`

---

## Step 3: 重写 CommentSection 组件

### 3a. 组件结构

```
components/article/CommentSection.tsx   （主组件，Client Component）
  ├── CommentList                   （评论列表，递归渲染嵌套回复）
  │     └── CommentItem             （单条评论：头像 + 昵称 + 内容 + 时间 + 操作）
  │           └── CommentItem (递归)   （子回复）
  └── CommentForm                   （评论输入框）
```

### 3b. 数据获取

- 使用 cf-comment 的 API：
  - `GET {CF_COMMENT_URL}/area/blog/comments` — 评论列表
  - `POST {CF_COMMENT_URL}/area/blog/comment` — 提交评论（FormData: content, parent_id, nickname, avatar_url）
- 评论列表为平面结构（含 parent_id），前端组装为树形结构用于嵌套显示
- 轮询/实时更新：提交成功后重新拉取列表

### 3c. 嵌套回复

- 评论列表按 parent_id 组装成树形结构
- 每条评论下方显示「回复」按钮
- 点击回复按钮后，展开内联回复输入框，预填 `@原评论昵称`
- 提交回复时 parent_id 设为被回复评论的 id
- 嵌套回复缩进显示（margin-left 递增，最多 3-4 层）

### 3d. UI 设计

- 深色主题，与博客整体风格统一
- 使用 Tailwind CSS + shadcn/ui 组件
- 单条评论卡片：左侧头像（40x40）+ 右侧内容（昵称 + 时间 + Markdown 渲染的内容）
- 昵称使用 `text-primary` 颜色，时间使用 `text-muted-foreground`
- 操作按钮：回复、点赞（仅样式，不实现去重）
- 输入框：textarea + 提交按钮，下方显示「你将以 XXX 的身份发表评论」
- 评论区高度变化时通过 postMessage 通知父页面（兼容原 iframe 高度同步机制）

### 3e. 样式细节

```
┌──────────────────────────────────────────────┐
│  评论 (6)                         [发表评论]    │
├──────────────────────────────────────────────┤
│  [avatar] 叶无痕 · 2小时前                       │
│  这篇文章写得真好，收益匪浅！                 │
│  回复 点赞                                  │
│                                              │
│    [avatar] 萧乘风 · 1小时前                    │
│    @叶无痕 同意！关注了这个博客。               │
│    回复 点赞                                  │
│                                              │  [avatar] = DiceBear SVG, 40x40
│  [avatar] 令狐望月 · 3小时前                  │
│  第一条评论的内容...                          │
│  回复 点赞                                  │
│                                              │
├──────────────────────────────────────────────┤
│  [avatar] 你将以 叶无痕 的身份发表评论         │
│  ┌──────────────────────┐ ┌────────┐       │
│  │ 输入评论内容...        │ │ 发表   │       │
│  └──────────────────────┘ └────────┘       │
└──────────────────────────────────────────────┘
```

**涉及文件：**
- 重写 `components/article/CommentSection.tsx`

---

## Step 4: 清理旧代码

- 移除 `lib/services.ts` 中 `getCommentEmbedUrl` 函数（不再用 iframe）
- 移除 `getCommentCount` 函数（前端直接调 API）
- CommentSection 不再接收 `pageKey` prop，硬编码使用 `blog`

**涉及文件：**
- `lib/services.ts`
- `app/article/[slug]/page.tsx`（移除 CommentSection 的 pageKey prop）

---

## 验证方式

1. `pnpm build` 确保构建通过
2. 访问文章页，评论区应显示深色风格的原生 UI
3. 发表评论，应自动分配昵称和头像
4. 点击某条评论的「回复」，应展开内联回复输入框
5. 提交回复，应在该评论下方显示嵌套的回复
6. 刷新页面，同一浏览器中昵称和头像应保持一致
7. 在不同浏览器中评论，应获得不同身份
