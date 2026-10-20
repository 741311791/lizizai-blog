# 卫生项清理

**优先级**:P3 | **类型**:chore | **创建**:2026-10-20

## 背景

全仓自查发现的文档债与观察期遗留，低风险顺手清。

## Requirements

1. **CLAUDE.md locale 纠正**：i18n 段写"默认 locale `en`，中文路径 `/zh`"，实际 `i18n/routing.ts:5` 为 `defaultLocale: 'zh'`（中文无前缀、英文 `/en` 前缀）。改写为准确描述，避免误导后续协作。
2. **next.config.ts 观察期域名**：`pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev` remotePattern 注释自述"过渡期兼容旧封面 URL，观察期后可移除"——域名迁移完成已近一个月（2026-10-01），移除该条目；若担心 ISR 旧缓存，可先 `rg r2.dev` 确认代码无引用后移除。
3. **`app/api/admin/sync/route.ts:58` 吞错留痕**：`ensureCommentAreas` 外层 `catch {}` 改为 `catch (err) { console.error('评论区自动创建失败:', err); }`，保持"失败不影响同步"语义不变。

## Acceptance Criteria

- [x] CLAUDE.md i18n 描述与 routing.ts 实际一致
- [x] `rg "r2.dev" next.config.ts` 零命中
- [x] admin sync 路由错误路径有 console.error
- [x] 改动文件 ESLint 零新增 error
