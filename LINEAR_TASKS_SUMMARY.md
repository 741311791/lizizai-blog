# Linear 任务跟踪总结

## 项目信息

**项目名称:** 博客重构：移除UGC  
**项目链接:** https://linear.app/bmad-method-web/project/博客重构：移除ugc-88d89265b54b  
**项目状态:** In Progress  
**优先级:** High

## 项目目标

将博客从包含用户生成内容(UGC)的平台转型为纯内容展示与Newsletter订阅的个人博客，规避法律风险，简化技术实现，聚焦内容传播和私域流量积累。

**核心目标:**
- 移除所有用户注册/登录功能
- 实现基于visitor_id的匿名访客系统
- 保留并改造点赞和分享功能
- 强化邮件订阅流程（双重确认机制）

## 任务清单

### Epic 1: 核心系统重构

| 任务编号 | 任务标题 | 优先级 | 状态 | 链接 |
| :--- | :--- | :--- | :--- | :--- |
| BMA-5 | [Auth] 移除所有用户认证代码 | High | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-5) |
| BMA-6 | [Visitor] 实现基于localStorage的匿名visitor_id系统 | High | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-6) |
| BMA-7 | [UI] 移除页头和菜单中的用户相关UI元素 | Medium | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-7) |

### Epic 2: 功能模块重构

| 任务编号 | 任务标题 | 优先级 | 状态 | 链接 |
| :--- | :--- | :--- | :--- | :--- |
| BMA-8 | [Likes] 重构点赞功能以适配visitor_id | High | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-8) |
| BMA-9 | [Likes] 创建用于匿名点赞的后端API和数据模型 | High | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-9) |
| BMA-10 | [Sharing] 为分享链接添加追踪参数 | Medium | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-10) |
| BMA-11 | [Comments] 彻底移除评论系统及相关组件 | High | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-11) |

### Epic 3: Newsletter 增强

| 任务编号 | 任务标题 | 优先级 | 状态 | 链接 |
| :--- | :--- | :--- | :--- | :--- |
| BMA-12 | [Subscribe] 在后端实现双重确认(Double Opt-in)机制 | High | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-12) |
| BMA-13 | [Subscribe] 更新订阅成功页面的UI，提示用户检查邮件 | Medium | Backlog | [查看任务](https://linear.app/bmad-method-web/issue/BMA-13) |

## 任务统计

- **总任务数:** 9
- **High 优先级:** 6 个
- **Medium 优先级:** 3 个
- **前端任务:** 6 个
- **后端任务:** 3 个

## 开发顺序建议

### 第一阶段（基础设施）
1. **BMA-6** - 实现 visitor_id 系统（前置依赖）
2. **BMA-5** - 移除用户认证代码
3. **BMA-7** - 清理 UI 中的用户元素

### 第二阶段（功能改造）
4. **BMA-9** - 创建后端匿名点赞 API（前置依赖）
5. **BMA-8** - 前端点赞功能重构
6. **BMA-11** - 移除评论和社区功能
7. **BMA-10** - 添加分享追踪参数

### 第三阶段（订阅增强）
8. **BMA-12** - 后端实现双重确认机制
9. **BMA-13** - 前端订阅页面 UI 更新

## 部署信息

- **前端部署:** https://lizizai.xyz/ (Vercel)
- **后端部署:** https://lizizai-blog.onrender.com (Render)

## 相关文档

- [重构计划详细文档](./REFACTORING_PLAN.md)
- [项目分析报告](./project_analysis_report.md)
