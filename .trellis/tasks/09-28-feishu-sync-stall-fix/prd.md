# 修复飞书同步增量失效与超时：恢复每日资讯自动更新

## Goal

博客每日资讯（daily-news）自 2026-08-23 起不再更新。诊断（见会话 sess_933cc32a）确认三层问题叠加，本任务修复根因并完成一次性追赶，恢复每日自动更新。

## Background（诊断结论）

1. **根因（增量判断口径不一致）**：`workers/feishu-blog-sync/src/sync.ts` 中
   - 判断侧 `blogFolderNeedsSync`（sync.ts:158-184）对 slides/html 子文件夹用**顶层 `listFiles`**（含子文件夹条目，如 `screenshots/`）取 max mtime；
   - 写入侧检查点（sync.ts:546-551）用 `syncSlidesFolder`/`syncHtmlFolder` 里 `listAllFilesRecursive`（仅文件）的 max mtime。
   - 飞书文件夹 mtime 恒晚于其内部文件 1–2 秒，导致含 PPT 的文章**每次运行都判"已修改"→ 全量重传**（上次 162 项中 76 全量、仅 6 跳过）。
   - podcast 与 article 两侧口径一致（均顶层），不受影响。
2. **超时**：全量一轮约 2 小时 > `timeout-minutes: 60`，工作流每次在写索引前被杀；`articles.json` 只在整个循环后写入（sync.ts:392），索引永远停在 8/23。单篇文章文件实际已传到 R2。
3. **无通知**：通知步骤仅 `failure()` 触发，超时是 `cancelled`，故一个多月无报警。

## Requirements

- R1 检查点口径统一：slides/html 检查点写入基准改为与判断侧一致的**顶层列表** max mtime（含子文件夹条目）。
- R2 索引增量写入：同步循环中每处理 N 篇（N=10）将当前 `allArticles` 写入 `articles.json` 一次，超时也能保留进度（含已跳过文章的 cached meta）。
- R3 通知补全：workflow 通知步骤条件改为 `failure() || cancelled()`。
- R4 一次性追赶：`timeout-minutes` 临时调至 180，手动 `workflow_dispatch` 触发全量追赶；验证索引刷新到最新日期后改回 60。
- R5 不改变 article/podcast 的既有增量语义；不自动清理飞书侧重复日期文件夹（2026-08-16/08-21 各两个，属用户数据，仅在收尾时提醒人工处理）。

## Constraints

- 修改仅限 `workers/feishu-blog-sync/src/sync.ts` 与 `.github/workflows/feishu-sync.yml`。
- 不得动工作区中无关的未提交改动（`components/layout/Header.tsx`、`MobileNav.tsx`）。
- 追赶运行依赖远端 main，需先推送修复再触发。

## Acceptance Criteria

- [x] AC1 代码审查：slides/html 检查点取值来源为顶层 `listFiles`（与 `blogFolderNeedsSync` 同口径）；article/podcast 未变。
- [x] AC2 本地校验通过：worker 测试 15/15 + 48/48 通过；tsc 仅报 3 处既有基线错（converter.ts:163 / feishu.ts:58 / sync.ts:502，均非本次改动行）。
- [x] AC3 workflow 含 `timeout-minutes: 180` 与 `if: failure() || cancelled()`，推送后手动触发成功启动（run 36332363018）。
- [x] AC4 追赶运行完成（success，1h37m）：`articles.json` 159 篇、覆盖至 2026-09-27、8/23 后无缺天；线上 `/daily-news` 显示 9 月 27 天。
- [x] AC5 验证 run 36338553546（timeout 已回 60）快速增量完成（详见 implement.md）；`timeout-minutes` 已改回 60（提交 2cbfcc3）。
- [x] AC6 提交 c570cab / 2cbfcc3，中文 conventional 前缀，只含本任务文件（未动 Header/MobileNav）。

## Notes

- 飞书侧重复日期文件夹会在索引中产生重复条目，建议用户后续手动整理（不在本任务内）。
