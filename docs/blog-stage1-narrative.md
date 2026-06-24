# lizizai-blog 叙事素材稿（阶段 1 产出）

> **数据源**：git log（94 commits，2025-10-29 → 2026-06-15）+ claude-mem timeline（2082 obs，2026-05-04 → 2026-06-15）
> **重要约束**：claude-mem 仅覆盖最近 6 周；项目前 5 个月（2025-10 → 2026-04）的历史只能从 git commit 重建。成文时涉及该段的细节需查 `git show <hash>` 或早期 worker 代码，勿臆测。

---

## 一、项目真实起点（git log 揭示，timeline 缺失）

项目并非"从一开始就是飞书博客"。起点是一个**克隆模板**：

- `8dc1199`（2025-10-29）Initial commit: "Letters Clone project with Next.js frontend and **Strapi backend**"
- 早期架构：Next.js + **Strapi（自托管 CMS）+ Supabase PostgreSQL**，带完整用户系统（login/register/profile）、Newsletter 订阅、Comment —— 是一个**带 UGC 的社区博客**

## 二、第一次架构转向：去 UGC，收缩为个人博客（2025-10-31）

commit 高度集中在 10-31：
- `18b6280` feat(BMA-5): 移除所有用户认证代码
- `76e0775` feat(BMA-7): 清理 UI 中的用户相关元素
- `3f3f234` feat(BMA-6): 实现 visitor_id 匿名访客系统
- `007487c`（11-02）feat: 完成博客重构 - 移除 UGC 功能
- `c35209b`（11-09）feat: 完成预上线优化 - 安全、性能、SEO 全面提升

**判断点**：从"社区平台"收缩为"个人博客"。匿名 visitor_id 替代用户系统——点赞/浏览量不再需要登录。这次转向预先决定了后续"功能拼装"的方向：每个功能都是无状态的外部服务，而非自建子系统。

## 三、第二次架构转向：扔掉 Strapi，用飞书当 CMS（2026-04-17）★ 核心故事点

中间有 **5 个月空白**（2025-11-09 → 2026-04-17），项目沉寂后带着全新方向回归：
- `b4bc9da` feat: 添加每日定时同步飞书文档（北京时间 0 点）
- `8b96bac` fix: 同步后主动清除 ISR 缓存，解决文章更新不可见问题

内容源从 Strapi（自托管 CMS）换成**飞书云文档**。

**判断点（为什么飞书，待成文深挖）**：写作体验（富文本 + 协作）、零额外运维（不用维护 Strapi/Postgres）、内容所有权（文档在自己账号里）。代价是引入了"同步层"——飞书 → Worker → R2 → ISR 的链路，以及 ISR 缓存清除的协调问题（`8b96bac`）。这次转向奠定了整个博客的架构哲学。

随后密集的功能升级（2026-04-17 `ec2d632` 全站功能升级 + `3b646ea` 全站 i18n）。

## 四、功能扩展期（2026-04-20 → 05-10）

- 全站 i18n：next-intl，默认 en，中文走 /zh（`3b646ea`）
- 每日 AI 新闻功能：D1 存储 → 后迁移到 R2（`68d1360` 实现、`7b58f40` refactor: Daily News 从 D1 迁移到 R2，复用分类页布局）
- 多内容类型：文章 / 播客 / 幻灯片 / HTML（`a43fcf7` 多内容类型前端适配 + GitHub Actions 同步迁移）

## 五、踩坑 saga：Cloudflare Workers 子请求超限（2026-05-05/06）★ 最强戏剧性

timeline obs 319-368 / session S40-S44。多内容类型同步上线后，飞书文档数量激增，撞上 Cloudflare Workers 免费计划的**子请求上限（subrequest limit）**。

调试路径（多方案反复试错）：
1. 增量同步优化 → 效果有限（obs 331）
2. 全局索引预加载 → 仍超限（obs 332-335）
3. Cloudflare Queue 分片方案 → 撞免费计划 Queue 限制（obs 390-426, S43）
4. 自调用分批（workers.dev 自调用）→ 自调用超时（obs 515-518）
5. 链式同步（中间稳定方案）→ 仍受 Workers 运行时约束（obs 499-507）

**最终结局（2026-05-08 → 05-10，代码已验证）**：跳出 Workers，把同步逻辑整体迁移到 **GitHub Actions**（`a43fcf7`）。Worker 降级为只读服务（`/health` `/status` `/debug/feishu`，见 `workers/feishu-blog-sync/src/index.ts:1-8`），sync.ts 注释明确"在 GitHub Actions 或本地 Node.js 环境中运行，**无子请求限制**"（`sync.ts:5`、`:737`）。

**判断点（修正）**：边缘计算的"免费"有硬约束。Queue/自调用/链式等"绕过"方案各有代价后，最终选择**换平台**——把重 I/O、不限执行时长的同步交给 GitHub Actions，Worker 只留轻量只读服务。这是"识别平台契合度，而非死磕单平台限制"的判断。

## 六、工程化成熟期（2026-05-25 → 06-14）

- **引入测试**（关键转折）：多播客重构时项目原本**零测试基础设施**（obs 1258），为此建立单元测试（worker 48/48 + frontend 31/31，obs 1268-1272, S120-S121），并为此把纯函数从同步逻辑中抽离（groupFilesByBaseName / matchPodcastFiles）
- 多播客模型：单播客 → 多播客列表（一篇文章可含多个播客，`0f518d7`）
- slug 统一：daily-news 命名规范化 + CRON 调至北京时间 09:00（`0a813b8`）
- 首页编译性能优化：API 请求 2N+2 → 2（`4ba4201`）
- R2 图片优化：`/_next/image` 500 超时 → WebP 缩略图 + CDN 配置（`76ad038`，obs 1783-1825, S189-S190）
- **AI 日报模板系统**（近期最大亮点，S195-S200）：
  - HTML 模板 + JSON Schema（boxes 动态卡片结构）+ LLM 提取 skill
  - 解决"日报内容结构多变"问题：Schema 泛化为通用 boxes，LLM 把任意日报 Markdown 提取成结构化 JSON
  - 含 Schema 通用性审查（S197，obs 1952-1959）——把硬编码模块重构为动态卡片

## 七、元层面：博客开始生产自己的工具（2026-06-07 → 06-15）

博客的构建工具被抽象成可复用 skill：
- `lizizai-html`：用博客自身设计系统生成嵌入式 HTML（主题 CSS 部署到 R2 CDN，S75）
- `ai-daily-extract`：AI 日报结构化数据提取（S198-S199）
- `ian-xiaohei-illustrations`：怪诞正文配图（S202-S203，2026-06-15 刚装）
- HTML TOC 集成（postMessage 协议，iframe ↔ 父页目录同步，`49fd171`）
- PPT 全屏预览 + 面包屑导航 + 同步变更追踪（`e9d0cf5`，最新 commit）

**判断点**：博客不再只是内容载体，它的内容生产流水线（模板 → 提取 → 配图 → 渲染）被封装成工具，可以反哺自身和其他项目。

---

## 判断点清单（成文时应强化的"记忆锚点"）

1. **飞书当 CMS** —— 用一个协作工具替代整个 CMS 后端，省掉 Strapi/Postgres 运维
2. **边缘服务拼装** —— 评论/点赞/统计/邮件/搜索各接一个 Cloudflare Worker，零自建
3. **双数据层** —— 生产 R2 + 备用本地 MDX，赌可靠性 + 保可调试性
4. **子请求超限** —— 免费边缘计算的硬约束，逼出链式分批架构
5. **博客生产自己的 skill** —— 内容流水线被抽象为可复用工具，博客反哺自身

## 待深挖清单（成文时用 get_observations / git show 补充细节）

- [ ] Strapi → 飞书迁移的具体动机与过程（2026-04，timeline 缺失）→ `git show b4bc9da` + 早期 worker 代码 + 当时的设计文档
- [ ] 子请求超限 saga 技术细节 → `get_observations([319..368])`
- [ ] AI 日报 Schema 通用性审查决策 → `get_observations([1952..1959])`（S197）
- [ ] 双数据层（lib/blog-data.ts vs lib/content.ts）设计动机 → 代码 + git blame
- [ ] 多播客重构引入测试的过程 → `get_observations([1258..1272])`（S120-S121）

## 建议的叙事侧重（供阶段 1 确认）

- **侧重 A：架构演进史** —— 以三次转向为骨架（克隆 → 个人 → 飞书 → 多内容 → 工具化），强调"为什么变"
- **侧重 B：边缘架构哲学** —— 聚焦飞书 CMS + 边缘服务拼装 + 子请求 saga，技术深度优先
- **侧重 C：构建者视角** —— 从"用别人的轮子拼博客"到"博客生产自己的工具"，突出工具链抽象与反哺
