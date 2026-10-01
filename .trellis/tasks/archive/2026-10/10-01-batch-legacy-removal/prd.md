# P0-b 删除遗留数据层 lib/content.ts + content/

## Goal

生产数据层唯一化为 lib/blog-data.ts（R2 读取），删除 0 引用的遗留 MDX 数据层。

## Background

- `lib/content.ts` 376 行，注释自述"替代原来的"，全仓 0 import（grep `lib/content'` 无命中）
- 与 blog-data.ts 并存 8 个同名导出（getAllArticles/getArticleBySlug/getArticlesByCategory/getArticlesByTag/getRelatedArticles/getCategories/getAllArticleSlugs/getAllCategorySlugs）——漂移隐患
- 独有导出（getCategoryBySlug/getTags/getTagBySlug/getAuthor/getAuthors/searchArticles/getArticleCount）同样无人调用
- `content/` 目录含遗留 articles/*.mdx、categories.yml、tags.yml、authors/*.yml

## Requirements

- R1 删除 `lib/content.ts`、`content/` 目录
- R2 评估 `scripts/migrate-strapi-to-mdx.ts`（gray-matter/yaml 的另一使用者）：一次性迁移脚本，随遗留层一并删除
- R3 `pnpm remove gray-matter yaml`（确认无其他使用者后）
- R4 CLAUDE.md「双数据层」段落改写为单一 R2 数据层描述
- R5 全局 grep 确认无残留 import（含 `content/` 路径字符串引用）

## Acceptance Criteria

- [x] AC1 `grep -r "lib/content\|from './content'" app components lib scripts` 无命中
- [x] AC2 `pnpm build` 成功（pagefind 索引正常，间接验证 setRequestLocale 链路未破坏）
- [x] AC3 CLAUDE.md 已更新且无 content/ 目录引用

## 执行记录

- 删除 lib/content.ts（376 行）、content/（含 articles/categories.yml/tags.yml/authors）、scripts/migrate-strapi-to-mdx.ts；pnpm remove gray-matter yaml
- 引用与注释清理：CLAUDE.md「双数据层」→「数据层」（唯一化）、types/index.ts:4、lib/blog-data.ts:4 过时注释改写
- build 通过：692/692 静态页、索引 682 页
