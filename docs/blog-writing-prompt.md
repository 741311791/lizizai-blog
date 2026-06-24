# lizizai-blog 技术博客写作 Prompt

可复用的写作流程 Prompt，用于生成介绍本博客项目的技术博客。

基于 skill 组合：`timeline-report` → `pathfinder` → `writing-shape` → `excalidraw` / `ian-xiaohei-illustrations` → `edit-article` → `lizizai-html`。

## 使用方法

1. 复制下方「Prompt 正文」的全部内容
2. 开新会话（或在当前会话），粘贴作为第一条消息
3. 按需调整顶部「配置区」
4. AI 会逐阶段推进，每阶段暂停等你确认后再继续

## 快速模式（省时间）

跳过阶段 1-2 的 skill 调用，直接让 AI 基于 `CLAUDE.md` + `git log` 写叙事与架构，从阶段 3（writing-shape）接入。能省约一半时间，代价是叙事深度略浅。

## 依赖说明

- 阶段 1 的 `timeline-report` 依赖 claude-mem 已有项目 observations。若反馈数据不足，退回快速模式。
- 阶段 4 的 `ian-xiaohei-illustrations` 需配合可用的图像生成能力（原 skill 设计依赖 Codex `image_gen`，Claude Code 中需替代为 Cloudflare `ai_image_generation` MCP 或外接生图 API）。

---

## Prompt 正文（复制以下所有内容）

# 任务：写一篇介绍 lizizai-blog 项目的技术博客

你是我的技术写作协作者。请按下面的分阶段流程，把 lizizai-blog 这个博客项目
写成一篇可发布的技术博客。**每完成一个阶段请暂停，等我确认后再进入下一阶段。**

---

## 【配置区】（请按你的侧重修改，不改则用默认值）

- 目标读者：独立开发者 / 全栈工程师 / 技术博主（默认：独立开发者 + 技术博主）
- 文章侧重：项目演进叙事 + 技术架构深度（两者平衡，默认）
- 篇幅：中篇 3000-5000 字（默认）
- 风格：严谨但生动，关键概念配怪诞插图（默认）
- 发布渠道：先在博客草稿，后续用 lizizai-html 转成嵌入式 HTML（默认）

---

## 【项目背景】（写作时的事实依据，避免臆测）

lizizai-blog 是一个中文博客平台，技术栈与架构要点：

- **技术栈**：Next.js 16 (App Router) + Tailwind v4 (OKLCH) + shadcn/ui，默认深色模式，
  next-intl 中英双语（默认 en，中文走 /zh）。部署在 Vercel + Cloudflare Workers。
- **两条数据流**：
  1. 博客内容：飞书文档 → 同步 Worker（CRON 每日 3AM）→ R2 存储 → Next.js ISR 渲染（revalidate 3600s）
  2. AI 资讯：外部采集 → Cloudflare D1 → Next.js API route → 首页 + /ai-news 归档页
- **双数据层**：lib/blog-data.ts（生产，R2）vs lib/content.ts（遗留/备用，本地 MDX）
- **边缘服务集成**：cf-comment（评论）、emaction（点赞）、Webviso（浏览量）、
  counterscale（分析）、Resend（邮件）、Pagefind（搜索，构建时索引）
- **AI 日报系统**（近期亮点）：HTML 模板 + JSON Schema + LLM 提取 skill，支持幻灯片全屏预览
- **内容更新闭环**：飞书编辑 → 同步 Worker → R2 → ISR 自动更新

值得写的「故事点」：为什么用飞书当 CMS、双数据层的设计取舍、边缘服务如何拼装出
完整博客功能、AI 日报模板系统是怎么跑通的、ISR + R2 的缓存策略。

---

## 【执行流程】（6 阶段，逐阶段推进）

### 阶段 1：项目叙事素材生成
- **使用 skill**：`claude-mem:timeline-report`
- **做什么**：基于项目的 git 历史和 claude-mem observations，生成「Journey Into lizizai-blog」叙事——
  为什么做、关键节点、踩过的坑、技术演进路径。
- **产出**：一份叙事素材稿（按时间/主题组织的关键事件 + 判断点）
- **暂停**：等我确认叙事方向和重点取舍

### 阶段 2：架构与功能梳理
- **使用 skill**：`claude-mem:pathfinder`（如不可用，退回 `claude-mem:smart-explore`）
- **做什么**：把代码库映射成特性分组，理清核心模块（双数据层、同步 Worker、ISR、AI 资讯、外部服务集成）
- **产出**：一张特性流程图 + 文章的「架构章节」大纲
- **暂停**：等我确认架构章节的详略

### 阶段 3：成文（素材 → 文章）
- **使用 skill**：`writing-shape`
- **做什么**：把阶段 1-2 的素材组织成连贯文章。先起草 2-3 个候选开头让我选，
  再逐段推进。每段讨论清楚用列表/表格/段落还是 callout。
- **产出**：完整初稿
- **暂停**：等我通读初稿反馈

### 阶段 4：配图（并行两类）
- **架构图**：`excalidraw` —— 画 1-2 张核心图
  - 首选：两条数据流的端到端架构图（飞书→Worker→R2→ISR；采集→D1→API→页面）
  - 次选：双数据层对比图
- **正文配图**：`ian-xiaohei-illustrations` —— 为 3-5 个抽象概念生成小黑怪诞配图
  - 候选概念：双数据层、ISR 缓存策略、边缘服务拼装、飞书 CMS 闭环
  - 要求：16:9、纯白手绘、小黑承担核心动作、不复刻旧构图、每张只讲一个概念
- **产出**：架构图 .excalidraw 文件 + 3-5 张小黑 PNG
- **暂停**：等我确认配图与文章的插入位置

### 阶段 5：润色定稿
- **使用 skill**：`edit-article`
- **做什么**：重构章节顺序、提升技术表述清晰度、收紧冗余文字、检查术语一致性
- **产出**：终稿 markdown
- **暂停**：等我确认是否进入发布

### 阶段 6：（可选）发布准备
- **使用 skill**：`lizizai-html`
- **做什么**：用博客自己的设计系统，把终稿转成可嵌入的独立 HTML
- **产出**：可发布到博客的 HTML 文件

---

## 【交付标准】

- 技术描述必须基于真实代码，不臆测；涉及具体实现时引用 file_path:line
- 文章有清晰的叙事弧（不是 README 翻译），读者能记住 1-2 个核心判断点
- 配图与正文强相关，架构图准确、小黑配图为抽象概念增加记忆点
- 中文（zh-CN），代码注释和 UI 文本一致

---

## 【现在开始】

请从阶段 1 开始。先告诉我你打算如何调用 timeline-report，以及需要我提供哪些额外上下文。
