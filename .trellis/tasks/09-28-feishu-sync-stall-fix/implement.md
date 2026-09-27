# 实施计划：飞书同步增量修复

## 前置

- 诊断已完成（见 prd.md Background），无需额外研究。
- 涉及文件：`workers/feishu-blog-sync/src/sync.ts`、`.github/workflows/feishu-sync.yml`。

## 执行清单（按序）

1. [x] **检查点口径修复（sync.ts）**
   - `syncSlidesFolder`（~792）：增加 `const topItems = await client.listFiles(folder.token)`，返回的 `maxModifiedTime` 改用 `maxModifiedTime(topItems)`（保留 `allFiles` 供文件过滤/上传用）。
   - `syncHtmlFolder`（~852）：同上。
   - 更新两函数及 `syncCheckpoints` 相关注释，说明"与 blogFolderNeedsSync 判断口径一致：顶层列表含子文件夹 mtime"。
2. [x] **索引增量写入（sync.ts performSync ~328-394）**
   - 循环内每处理 10 篇（`allArticles.length % 10 === 0` 时）用 `env.R2`（不走 trackedR2，避免变更清单重复）写一次 `articles.json`。
   - 最终完整写入保持不变（trackedR2）。
   - 注释说明动机：超时/中断时保留进度。
3. [x] **workflow 调整（feishu-sync.yml）**
   - `timeout-minutes: 60` → `180`（注释标注"临时：追赶运行后改回 60"）。
   - 通知步骤 `if: failure()` → `if: failure() || cancelled()`，文案同步调整。
4. [x] **本地校验**
   - `cd workers/feishu-blog-sync && npx tsc --noEmit`（若无 tsconfig 则用 tsx 语法检查或 `npx tsc --noEmit -p .`）。
   - 检查 `src/__tests__/` 是否有受影响测试并运行。
   - YAML 校验：`python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/feishu-sync.yml'))"` 或 actionlint（如有）。
5. [x] **提交推送**
   - 只 stage：`workers/feishu-blog-sync/src/sync.ts`、`.github/workflows/feishu-sync.yml`、`.trellis/tasks/09-28-feishu-sync-stall-fix/`。
   - 提交信息：`fix(sync): 增量检查点口径统一+索引增量写入+超时告警，恢复每日资讯更新`。
   - push origin main。
6. [x] **追赶运行（ops）**
   - `gh workflow run 飞书博客同步`（workflow_dispatch，不带 force）。
   - `gh run watch` 后台监控（预计 ~2h）。
   - 结果：run 36332363018 **success，1h37m**；运行中实测增量落盘生效（15 分钟时索引已含 09-26/09-27 最新 10 篇）。
7. [x] **验证与收尾**
   - 索引验证：159 篇（基线 127），daily-news 152 条，覆盖 2026-04-27 ~ **2026-09-27**，8/23 后无缺天，无重复 slug；线上 `lizizai.xyz/daily-news` 已显示 9 月全部 27 天。
   - 快速增量确认：timeout 改回 60 后触发验证 run 36338553546（结果见 prd AC5）。
   - `timeout-minutes` 已改回 60（提交 2cbfcc3）。
   - spec 更新：新建 `.trellis/spec/workers/`（index + feishu-sync-incremental.md 契约）。

## 回滚点

- 代码回滚：revert 提交即可，同步器无状态迁移（检查点语义变化向后兼容：旧检查点只是偏小，多同步一次）。
- ops 回滚：追赶失败不影响线上（articles.json 增量写入前的完整旧索引仍在；R2 put 幂等）。

## 风险

- 追赶运行仍可能超 180 分钟：增量写索引保证进度不丢，次日 cron 续跑收尾。
- r2.dev 公开 URL 有 CDN 缓存：验证时加 `?t=<ts>` 查询参数绕缓存。
