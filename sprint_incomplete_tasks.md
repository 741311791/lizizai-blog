# 博客重构项目 - 未完成任务报告

**项目名称:** 博客重构：移除UGC  
**项目状态:** In Progress  
**报告日期:** 2025年11月3日  
**分析师:** Manus AI

## 项目概览

该项目旨在将博客从包含用户生成内容（UGC）的平台转型为纯内容展示与 Newsletter 订阅的个人博客，以规避法律风险、简化技术实现，并聚焦于内容传播和私域流量积累。

**核心目标：**
- 移除所有用户注册/登录功能
- 实现基于 `visitor_id` 的匿名访客系统
- 保留并改造点赞和分享功能
- 强化邮件订阅流程（双重确认机制）

## 任务完成情况统计

| 状态 | 任务数量 | 占比 |
| :--- | :---: | :---: |
| **已完成 (Done)** | 3 | 33.3% |
| **待办 (Backlog)** | 6 | 66.7% |
| **总计** | 9 | 100% |

## 已完成任务 ✅

以下任务已成功完成：

### 1. BMA-5: [Auth] 移除所有用户认证代码
- **优先级:** High
- **状态:** Done
- **完成日期:** 2025-10-31
- **描述:** 移除了项目中所有与用户认证相关的代码和页面，包括认证页面目录、用户个人资料页面、认证逻辑核心文件以及全局认证状态管理。

### 2. BMA-6: [Visitor] 实现基于 localStorage 的匿名 visitor_id 系统
- **优先级:** High
- **状态:** Done
- **完成日期:** 2025-10-31
- **描述:** 创建了匿名访客识别系统，用于替代用户账户系统。实现了 `getVisitorId()` 函数，通过 localStorage 存储并管理访客的唯一标识符。

### 3. BMA-7: [UI] 移除页头和菜单中的用户相关 UI 元素
- **优先级:** Medium
- **状态:** Done
- **完成日期:** 2025-10-31
- **描述:** 清理了网站导航和布局中所有与用户账户相关的 UI 组件，包括用户菜单、登录/注册按钮等。

## 未完成任务 📋

以下是当前仍处于 **Backlog** 状态的 6 个任务，按优先级和建议执行顺序排列：

### 高优先级任务 (High Priority)

#### 1. BMA-9: [Likes] 创建用于匿名点赞的后端 API 和数据模型
- **优先级:** High
- **状态:** Backlog
- **任务链接:** [查看任务](https://linear.app/bmad-method-web/issue/BMA-9/likes-创建用于匿名点赞的后端api和数据模型)
- **描述:** 在 Strapi 后端创建支持匿名点赞的 API 端点和数据模型。
- **任务清单:**
  - 在 Strapi 中创建新的 Content-Type: `Like`，包含字段 `article (relation)`, `visitorId (string)`
  - 创建自定义 API 端点 `POST /api/articles/:id/like`
  - 实现端点逻辑：接收 `visitorId`，检查 `Like` 表中是否已存在 `(articleId, visitorId)` 记录
  - 若不存在，创建新记录并使对应文章的 `likes` 字段加一
  - 实现防刷机制：同一 `visitorId` 在短时间内（如 1 分钟）只能点赞一次
  - 添加错误处理和日志记录

#### 2. BMA-8: [Likes] 重构点赞功能以适配 visitor_id
- **优先级:** High
- **状态:** Backlog
- **依赖:** BMA-9（需要先完成后端 API）
- **任务链接:** [查看任务](https://linear.app/bmad-method-web/issue/BMA-8/likes-重构点赞功能以适配visitor-id)
- **描述:** 将点赞功能从基于用户账户改造为基于匿名访客 ID。
- **任务清单:**
  - 修改 `frontend/components/article/ArticleActions.tsx`
  - 移除 `isLiked` 的 `useState`，改为从 `localStorage` 读取已点赞文章列表
  - 在 `handleLike` 事件中调用 `getVisitorId()` 获取访客 ID
  - 向后端新 API 端点 `POST /api/articles/:id/like` 发送请求（包含 `visitorId`）
  - 成功后更新 `localStorage` 中的已点赞列表
  - 实现乐观更新 UI，提升用户体验

#### 3. BMA-11: [Comments] 彻底移除评论系统及相关组件
- **优先级:** High
- **状态:** Backlog
- **任务链接:** [查看任务](https://linear.app/bmad-method-web/issue/BMA-11/comments-彻底移除评论系统及相关组件)
- **描述:** 移除所有与评论功能相关的代码和 UI。
- **任务清单:**
  - 删除评论区组件 `frontend/components/article/CommentSection.tsx`
  - 修改文章详情页 `frontend/app/article/[slug]/page.tsx`，移除对 `CommentSection` 的调用
  - 删除社区讨论页面 `frontend/app/chat/`
  - 从 `ArticleActions` 组件中移除评论数显示和跳转功能
  - 移除书签（Bookmark）按钮

#### 4. BMA-12: [Subscribe] 在后端实现双重确认（Double Opt-in）机制
- **优先级:** High
- **状态:** Backlog
- **任务链接:** [查看任务](https://linear.app/bmad-method-web/issue/BMA-12/subscribe-在后端实现双重确认double-opt-in机制)
- **描述:** 为邮件订阅功能添加双重确认机制，提高订阅质量和合规性。
- **任务清单:**
  - 修改 `Subscriber` Content-Type，增加字段：`confirmationToken (string, unique)`, `confirmedAt (datetime)`
  - 修改 `POST /api/subscribers/subscribe` 控制器：创建订阅者时 `status` 设为 `pending`，生成唯一 `confirmationToken`
  - 发送包含确认链接的邮件（如 `https://lizizai.xyz/api/subscribe/confirm?token=...`）
  - 创建新 API 路由 `GET /api/subscribe/confirm`
  - 实现确认逻辑：根据 `token` 查找订阅者，更新 `status` 为 `active`，清空 `token`，设置 `confirmedAt`
  - 添加 token 过期机制（24 小时）

### 中优先级任务 (Medium Priority)

#### 5. BMA-10: [Sharing] 为分享链接添加追踪参数
- **优先级:** Medium
- **状态:** Backlog
- **任务链接:** [查看任务](https://linear.app/bmad-method-web/issue/BMA-10/sharing-为分享链接添加追踪参数)
- **描述:** 在分享功能中添加 UTM 参数和 `visitor_id`，用于追踪分享效果。
- **任务清单:**
  - 修改 `frontend/components/article/ArticleActions.tsx` 的 `handleShare` 函数
  - 在分享前构建新 URL，附加追踪参数：`utm_source=share`, `visitor_id=xxx`
  - 确保参数正确编码
  - 测试在不同平台（微信、Twitter 等）的分享效果

#### 6. BMA-13: [Subscribe] 更新订阅成功页面的 UI，提示用户检查邮件
- **优先级:** Medium
- **状态:** Backlog
- **依赖:** BMA-12（需要先完成双重确认机制）
- **任务链接:** [查看任务](https://linear.app/bmad-method-web/issue/BMA-13/subscribe-更新订阅成功页面的ui，提示用户检查邮件)
- **描述:** 修改前端订阅页面，明确告知用户需要通过邮件确认订阅。
- **任务清单:**
  - 修改 `frontend/app/subscribe/page.tsx` 的成功提示信息
  - 强调用户需要检查邮箱（包括垃圾邮件文件夹）并点击确认链接
  - 添加"未收到邮件？"的帮助信息和重新发送功能
  - 优化 UI 设计，使确认流程更加清晰

## 建议执行顺序

根据任务依赖关系和优先级，建议按以下顺序执行：

### 第一批（可并行）
1. **BMA-9** - 创建后端匿名点赞 API（后端任务）
2. **BMA-11** - 移除评论系统（前端任务）
3. **BMA-12** - 实现双重确认机制（后端任务）

### 第二批（依赖第一批）
4. **BMA-8** - 前端点赞功能重构（依赖 BMA-9）
5. **BMA-13** - 更新订阅页面 UI（依赖 BMA-12）

### 第三批（独立任务）
6. **BMA-10** - 添加分享追踪参数（可随时执行）

## 风险与建议

### 关键风险
1. **邮件功能未启用:** 根据代码分析，后端 `config/plugins.ts` 中邮件功能被注释，BMA-12 和 BMA-13 的实施需要先解决邮件配置问题。
2. **测试覆盖不足:** 项目缺乏自动化测试，建议在实施重构任务时同步编写单元测试和集成测试。

### 改进建议
1. **优先启用邮件服务:** 在开始 BMA-12 之前，先完成 Resend 邮件服务的配置和测试。
2. **分阶段部署:** 建议按照上述执行顺序分批次部署，每批次完成后进行充分测试。
3. **文档更新:** 每完成一个任务，及时更新项目文档和 API 文档。

---

**报告结束**
