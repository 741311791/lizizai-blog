# 全仓自查优化（数据层/SEO/转化/卫生）

**优先级**:P1 | **类型**:epic | **创建**:2026-10-20

> **执行结果（2026-10-20）**: 6/6 子任务全部完成并验收（详见各子任务 prd.md 执行记录）。共改 15 文件（新增 2：NewsletterCta.tsx、/api/og/route.tsx；新增资产 public/covers/default-cover.png）。全批改动 lint 0 error（2 个 warning 为既有遗留）；dev 下首页/文章/分类/daily-news/订阅页回归 200；blog-data 测试 16/16。未 git commit（遵守约束）。生产社交平台 OG 抓取预览待部署后验证。

> 2026-10-20 全仓自查产出。总评：仓库健康度高（服务端 markdown 预渲染、R2 重试、admin 安全、同步 revalidate 回调、双语 sitemap、JSON-LD 均就位），本批次聚焦剩余软失败盲区、SEO 缺口与 Substack 上线后的转化闭环。

## 子任务与执行顺序

| 顺序 | 任务 | 优先级 | 说明 |
|---|---|---|---|
| 1 | `10-20-data-layer-failfast` | P1 | 软失败对齐（空正文 200 缓存 / 静默空分类） |
| 2 | `10-20-sitemap-fix` | P1 | 补 daily-news/resume + 真实 lastModified |
| 3 | `10-20-article-newsletter-cta` | P2 | 文章尾订阅 CTA（Substack 转化闭环） |
| 4 | `10-20-dynamic-og-image` | P2 | next/og 动态分享卡 |
| 5 | `10-20-brand-placeholder-cover` | P2 | 品牌默认封面替换 picsum |
| 6 | `10-20-hygiene-cleanup` | P3 | CLAUDE.md/r2.dev/吞错三项清理 |

## 全局约束（所有子任务遵守）

1. UI 文本中文为主并走 next-intl（zh/en 双文件同步）
2. Server Components 默认，Client 仅交互；视觉遵循 DESIGN.md，不加徽章/角标
3. 每个子任务完成：改动文件 lint 零新增 error + dev 渲染验证（R2 可达时）；不主动 git commit/push
4. 行号基于 2026-10-20 快照，执行时以实际代码为准

## 明确不做（防过度工程，自查报告已裁定）

- `getAllArticles` 全量 JSON 分页化（当前量级无瓶颈）
- `sync.ts` 拆文件（函数边界清晰，拆分风险大于收益）
- feed 三套路由合并（能用，重构收益低）
- 文章级 Substack frontmatter 标记（架构文档 §6.2 保持 YAGNI）
