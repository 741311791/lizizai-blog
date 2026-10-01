# P3 质量基线：postbuild 吞错 + 类型收敛 + 测试纠偏

## Goal

修复静默失败路径，建立可扩展的质量基线。范围克制，不做大重构。

## Requirements

- R1 package.json postbuild 去 `|| true`：Pagefind 失败必须让构建失败（历史上 pagefind 1.5+ ES module 问题曾致线上搜索静默全空）
- R2 lib/markdown.ts:1 与 components/article/MarkdownContent.tsx:3 的整文件 `eslint-disable no-explicit-any`：为 rehype 插件回调定义局部类型（如 `type RehypeNode = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: RehypeNode[] }`），逐步替换 `: any`（markdown.ts 10 处、MarkdownContent.tsx 8 处），最终撤掉整文件禁用；确属第三方结构不明处保留单行 disable 并注释原因
- R3 lib/__tests__/blog-data.test.ts 改为真 import 被测模块（当前是复制 resolvePodcastUrls 实现独立测试，漂移即失效）；若 import 触发 R2 fetch，则将 fetch 依赖注入/mock，保持可独立运行
- R4 不引入 vitest 等新 runner（YAGNI，维持 tsx 直跑模式）

## Acceptance Criteria

- [x] AC1 故意改错 pagefind 输出路径时 postbuild 非零退出（验证后还原）
- [x] AC2 markdown.ts / MarkdownContent.tsx 整文件 eslint-disable 已移除，lint 通过
- [x] AC3 `npx tsx lib/__tests__/blog-data.test.ts` 全部通过且文件顶部 import 自 lib/blog-data.ts

## 执行记录

- R1 postbuild 去 `|| true`；失败路径实测 exit 101 显性化（坏路径注入后已还原，正常路径通过）
- R2 markdown.ts/MarkdownContent.tsx 整文件 no-explicit-any disable 删除，18 处 any 类型化（HastNode 导出复用 / ReactNode 官方类型 / ComponentProps）；顺手清 blog-data.ts 两处 any（RawArticle/RawCategory 最小接口，暴露并修复 publishedAt 缺失边界）
- R3 测试改真 import：resolvePodcastUrls+R2_BASE 拆至 blog-data-utils.ts（纯函数模块，绕开 beautiful-mermaid ESM-only 的 CJS 加载链——原"复制实现"的根因），测试 16/16 通过
- 类型收紧暴露并修复 3 处运行时边界：parent/parent.children 空值保护（×2）、publishedAt 兜底
- 最终验证：tsc 0 错 / lint 改动文件 0 问题 / build 692/692 + 索引 682 页 / 测试 16/16
