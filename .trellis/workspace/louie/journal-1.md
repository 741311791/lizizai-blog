# Journal - louie (Part 1)

> AI development session journal
> Started: 2026-09-08

---

## 2026-09-28 · 修复飞书同步增量失效（09-28-feishu-sync-stall-fix）

- 每日资讯停更 35 天的根因：增量判断（顶层列表，含子文件夹 mtime）与检查点写入（递归文件列表）口径不一致，飞书文件夹 mtime 恒晚于内部文件 1–2s → 含 PPT 文章每轮全量重传 ~2h > timeout 60min → 索引永远写不回，且 cancelled 不触发通知、静默漏报。
- 修复：检查点统一顶层口径；循环每 10 篇增量落盘 articles.json；通知补 `cancelled()`。追赶 run 1h37m 成功，索引 127→159 篇、覆盖至 09-27，线上已验证；timeout 改回 60。
- 沉淀：`.trellis/spec/workers/feishu-sync-incremental.md`（判断/写入同口径契约 + 超时先查增量再调参）；回归测试 8/9/10 组。
- 待用户处理：飞书 Daily News 重复日期文件夹（08-16/08-21 各两个）建议手动清理（本次索引未出现重复 slug，影响仅潜在）。
