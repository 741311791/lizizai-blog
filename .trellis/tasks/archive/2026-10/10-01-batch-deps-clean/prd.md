# P0-a 删除 13 个零引用依赖

## Goal

移除 app/components/lib 中 grep 实测 0 引用的依赖，缩小安装面与安全审计面。

## Requirements

- R1 `pnpm remove zustand react-hook-form @hookform/resolvers zod reading-time js-cookie @types/js-cookie random_chinese_fantasy_names date-fns @radix-ui/react-accordion @radix-ui/react-tooltip tailwindcss-animate tw-animate-css`
- R2 `next.config.ts:56` `optimizePackageImports` 中移除 `date-fns`（保留 `lucide-react`），删除后仅为 `['lucide-react']`
- R3 保留 `katex`：无直接 import 但 `rehype-katex` 依赖（lib/markdown.ts、MarkdownContent.tsx 在用）
- R4 保留 `gray-matter`/`yaml`：由子任务 legacy-removal 处理（其使用者 lib/content.ts 先删）

## Acceptance Criteria

- [x] AC1 `pnpm install` 后 `pnpm lint` 无新增报错
- [x] AC2 `pnpm build` 成功
- [x] AC3 抽查 `pnpm why zustand react-hook-form zod date-fns` 均报 not found

## 执行记录

- 13 包已移除（pnpm remove 1.8s）；next.config.ts optimizePackageImports 收敛为 ['lucide-react']
- lint 827 problems 为既有基线（.understand-anything/.trash、.video/remotion 等目录），本次改动文件 0 新增问题
- build 成功：682 页 / 2 语言 / 29992 词索引（首次失败为本机→R2 瞬时抖动，重跑通过）
- pnpm why zod 仍显示：为 eslint-config-next 传递依赖，非直接依赖，符合预期
