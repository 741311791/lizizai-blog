# 前端重构计划：移除 UGC 并转向匿名互动

**日期:** 2025年10月31日
**版本:** 1.0

## 1. 背景与目标

根据新的产品定位，博客将从一个包含用户生成内容（UGC）的平台，转型为一个纯内容展示与 Newsletter 订阅的个人博客。此举旨在规避潜在的法律风险，简化技术实现，并聚焦于核心的内容传播和私域流量积累。

**核心目标：**
-   移除所有需要用户注册/登录的功能。
-   用基于浏览器本地存储的匿名访客系统 (`visitor_id`) 替代用户账户系统。
-   保留并改造点赞和分享功能，使其适应匿名互动模式。
-   强化邮件订阅流程，引入双重确认机制（Double Opt-in）。

## 2. 现有功能与新需求对比

| 功能模块 | 现有实现 (需要移除或修改) | 新需求 (重构目标) |
| :--- | :--- | :--- |
| **用户系统** | 完整的用户注册、登录、登出、个人资料管理 (`/lib/auth.ts`, `AuthContext`, 相关页面)。 | **完全移除**。由匿名的 `visitor_id` 系统替代。 |
| **评论系统** | 文章详情页包含评论区和评论表单 (`CommentSection.tsx`)，依赖用户登录。 | **完全移除**。禁用所有文章的评论功能。 |
| **社区讨论** | 存在一个独立的 `/chat` 页面，用于社区交流。 | **完全移除**。该页面属于 UGC 范畴。 |
| **点赞功能** | `ArticleActions.tsx` 中的点赞是基于客户端状态，没有与后端用户关联。 | 基于 `visitor_id` 实现**匿名点赞**，后端记录 `(articleId, visitorId)` 防止重复，并增加防刷机制。 |
| **书签功能** | `ArticleActions.tsx` 中包含书签功能，依赖用户状态。 | **完全移除**。该功能需要用户账户支持。 |
| **邮件订阅** | 用户在 `/subscribe` 页面提交邮箱即可订阅，后端直接激活。 | 引入**双重确认机制**。用户提交邮箱后，需点击邮件中的链接才能完成订阅。 |
| **分享功能** | 使用浏览器原生的 `navigator.share` API。 | 在分享链接中增加 `utm_source` 和 `visitor_id` 等**追踪参数**，用于分析传播效果。 |

## 3. 详细重构任务清单

### 第一阶段：核心系统剥离与替换

1.  **移除认证体系**
    -   `[删除]` 认证页面目录: `frontend/app/(auth)/`。
    -   `[删除]` 用户个人资料页面: `frontend/app/profile/` 和 `frontend/app/account/`。
    -   `[删除]` 认证逻辑核心: `frontend/lib/auth.ts`。
    -   `[删除]` 全局认证状态管理: `frontend/contexts/AuthContext.tsx`。
    -   `[修改]` 根布局 `frontend/app/layout.tsx`，移除 `AuthProvider`。
    -   `[修改]` 移除所有组件中与 `useAuth` 或用户状态相关的代码。

2.  **实现 `visitor_id` 匿名访客系统**
    -   `[创建]` 新的工具函数 `frontend/lib/visitor.ts`。
    -   `[实现]` 在 `visitor.ts` 中创建 `getVisitorId` 函数：
        -   检查 `localStorage` 中是否存在 `visitor_id`。
        -   若不存在，则使用 `crypto.randomUUID()` 生成一个新的 ID 并存入 `localStorage`。
        -   函数返回该 ID。
    -   `[注意]` 所有对 `localStorage` 的操作都必须在 `useEffect` 或客户端组件事件处理器中执行，以避免服务端渲染（SSR）错误。

### 第二阶段：功能模块重构

1.  **重构点赞功能**
    -   `[后端]` 在 Strapi 中创建一个新的 `Content-Type`，命名为 `Like`，包含字段：`article (relation)`, `visitorId (string)`。
    -   `[后端]` 创建一个新的自定义 API 端点 `POST /api/articles/:id/like`。
    -   `[后端]` 该端点逻辑：接收 `visitorId`，检查 `Like` 表中是否已存在 `(articleId, visitorId)` 记录。若不存在，则创建新记录并使对应文章的 `likes` 字段加一。
    -   `[前端]` 修改 `frontend/components/article/ArticleActions.tsx`：
        -   移除 `isLiked` 的 `useState`，改为从 `localStorage` 中读取一个已点赞文章列表。
        -   在 `handleLike` 事件中，调用 `getVisitorId()` 获取访客 ID。
        -   向新的后端 API 端点发送请求。
        -   成功后，更新 `localStorage` 中的已点赞列表。

2.  **重构分享功能**
    -   `[前端]` 修改 `frontend/components/article/ArticleActions.tsx` 的 `handleShare` 函数。
    -   在分享前，构建新的 URL，附加追踪参数：`url.searchParams.append('utm_source', 'share'); url.searchParams.append('visitor_id', getVisitorId());`。

3.  **移除评论和社区功能**
    -   `[删除]` 评论区组件 `frontend/components/article/CommentSection.tsx`。
    -   `[修改]` 文章详情页 `frontend/app/article/[slug]/page.tsx`，移除对 `<CommentSection />` 的调用。
    -   `[删除]` 社区讨论页面 `frontend/app/chat/`。

### 第三阶段：邮件订阅流程增强

1.  **实现双重确认 (后端)**
    -   `[后端]` 修改 `Subscriber` Content-Type，增加两个字段：`confirmationToken (string, unique)` 和 `confirmedAt (datetime)`。
    -   `[后端]` 修改 `POST /api/subscribers/subscribe` 控制器逻辑：
        -   创建订阅者时，`status` 设为 `pending`。
        -   生成一个唯一的 `confirmationToken`。
        -   发送一封包含确认链接（例如 `https://lizizai.xyz/api/subscribe/confirm?token=...`）的邮件。
    -   `[后端]` 创建一个新的 API 路由 `GET /api/subscribe/confirm`。
    -   `[后端]` 该路由的控制器逻辑：根据 `token` 查找订阅者，将 `status` 更新为 `active`，清空 `confirmationToken`，并设置 `confirmedAt` 时间。

2.  **更新前端提示**
    -   `[前端]` 修改 `frontend/app/subscribe/page.tsx` 的成功提示信息，明确告知用户需要检查邮箱并点击确认链接。

### 第四阶段：UI 清理

-   `[删除]` 用户菜单组件 `frontend/components/auth/UserMenu.tsx`。
-   `[修改]` 网站页头 `frontend/components/layout/Header.tsx`，移除登录/注册按钮和用户头像菜单。
-   `[修改]` `ArticleActions.tsx`，移除书签 (`Bookmark`) 按钮。
-   `[审查]` 审查并移除项目中所有遗留的“登录”、“注册”、“我的账户”等入口链接。

## 4. Linear 任务跟踪

为了跟踪开发进度，将在 Linear 中创建一个名为 **“博客重构：移除UGC”** 的项目，并创建以下任务：

-   **Epic: 核心系统重构**
    -   `FE-1`: [Auth] 移除所有用户认证代码 (页面, Context, lib)。
    -   `FE-2`: [Visitor] 实现基于 localStorage 的匿名 `visitor_id` 系统。
    -   `FE-3`: [UI] 移除页头和菜单中的用户相关 UI 元素。

-   **Epic: 功能模块重构**
    -   `FE-4`: [Likes] 重构点赞功能以适配 `visitor_id`。
    -   `BE-1`: [Likes] 创建用于匿名点赞的后端 API 和数据模型。
    -   `FE-5`: [Sharing] 为分享链接添加追踪参数。
    -   `FE-6`: [Comments] 彻底移除评论系统及相关组件。
    -   `FE-7`: [Pages] 删除所有 UGC 相关页面 (`/chat`, `/profile` 等)。

-   **Epic: Newsletter 增强**
    -   `BE-2`: [Subscribe] 在后端实现双重确认 (Double Opt-in) 机制。
    -   `FE-8`: [Subscribe] 更新订阅成功页面的 UI，提示用户检查邮件。
