# 批量优化：依赖 / 死代码 / 性能 / DRY / 质量基线

## Goal

基于 2026-10-01 三路全量审计（依赖扫描 + Explore 性能审计 + Explore 代码质量审计），按 P0→P3 依次执行五批优化。每批独立可验证、可单独回滚。

## Background

审计实测结论（全部有文件:行号佐证，见各子任务 prd）：
- 13 个零引用依赖仍在安装；`lib/content.ts` 376 行全仓 0 import 但与生产数据层并存 8 个同名 API
- 9 个组件仅用 `useTranslations`（Server Component 同样支持）却标了 `use client`
- iframe 查看器 / 分享 URL / 社交链接 / R2 兜底域名存在平行实现
- 唯一测试不 import 被测模块；postbuild `|| true` 吞 Pagefind 失败

## Requirements

- R1 五个子任务按序执行：deps-clean → legacy-removal → server-components → dry-consolidation → quality-baseline
- R2 每批完成后 `pnpm lint` + `pnpm build` 验证通过才进入下一批
- R3 全程不执行 git commit/push（用户明确保留审查权）
- R4 不改变任何业务行为：本任务树属清理/收敛，非功能变更

## Acceptance Criteria

- [x] AC1 五个子任务全部完成且各自 AC 通过
- [x] AC2 最终 `pnpm build` 成功，pagefind 索引生成正常
- [x] AC3 `node_modules` 中不再含被移除的 13 个包；`pnpm why zustand` 等报 not found

## 执行总结（2026-10-01）

五批全部完成，每批独立验证后推进：
1. **deps-clean**：13 个零引用依赖移除，optimizePackageImports 死配置清理
2. **legacy-removal**：lib/content.ts(376 行)+content/+scripts/ 删除，gray-matter/yaml 移除，CLAUDE.md 数据层唯一化
3. **server-components**：9 个假 Client Component 降级，getBatchViews 无效缓存配置删除，6 个 route 显式 revalidate 3600
4. **dry-consolidation**：IframeFrame 共享封装 / 分享 URL 双份收敛(+bluesky/notes 补齐) / SOCIALS 常量化 / seo.ts env 兜底；R2 域名统一因涉及生产数据变更调整为注释交叉引用+决策留档
5. **quality-baseline**：postbuild 吞错移除 / 两文件整文件 any 禁用清零(18 处) / 测试真 import 化(blog-data-utils 拆分)

**未做（留待决策）**：R2 写侧 r2.dev → 自定义域迁移（需改 workflow + 重写存量 meta）
**全部改动未 commit**，工作区待审查
