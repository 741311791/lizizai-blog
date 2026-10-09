# 文章页细节修复与页头视觉对齐

## Goal

修复 ContentComingSoon html 类型崩溃、切换器溢出、侧边栏重复 Tags、HTML 模式隐藏 RSS；统一侧边栏模块标题为双语 Guide 风格；Daily News 页头对齐 PageHeaderV2 并引入线条变体；归档页宽度对齐。

## Changes（已完成）

1. **instrumentation Edge 告警修复**：`instrumentation.ts` 加 `NEXT_RUNTIME === 'nodejs'` 守卫，Node-only 逻辑拆至 `instrumentation.node.ts`（node:dns ipv4first + undici 代理）。
2. **ContentComingSoon 崩溃修复**：`showComingSoon` 含 html 分支但 config 缺 html → type 扩展为 `'podcast' | 'slides' | 'html'`，补 `htmlComingSoonTitle/Desc` 翻译（zh/en）。
3. **ContentTypeSwitcher 溢出修复**：侧边栏 280px → 320px（`ArticleDetailClient` + article `loading.tsx` 骨架同步），按钮加 `min-w-0`、图标 `shrink-0`，保持单行布局。
4. **侧边栏重复 Tags**：`ArticleSidebar` / `HtmlSidebarV2` 删掉各自重复的标签块，统一由 `SidebarStats` 渲染。
5. **HTML 模式隐藏 RSS**：`SidebarStats` 新增 `showFeeds` prop，`HtmlSidebarV2` 传 `false`。
6. **侧边栏标题统一**：新增 `components/article/SidebarSectionTitle.tsx`（mono 英文眉题 + 本地化粗体主标题 + 渐变短线），应用于内容形式/目录/阅读指南/阅读数据/标签/RSS 六个模块。
7. **Daily News 页头对齐**：改用 `PageHeaderV2`；`PageHeaderV2` 新增 `variant` 线条变体（archive=circuit / daily-news=pulse / category=rails）。
8. **归档页宽度对齐**：`max-w-4xl` → `max-w-[1200px]`。
9. **resume 页图片告警**：hero-portrait Image 加 `w-auto`。

## Acceptance Criteria

- [x] 访问无 contentTypes 的旧文章切换 HTML 类型不再崩溃，显示兜底页
- [x] 切换器单行 4 按钮在中英文下均无溢出
- [x] HTML 模式侧边栏无 RSS 模块，Tags 仅出现一次
- [x] daily-news / category / archive 三页 hero 风格统一、线条形态各异、容器同宽
- [x] `tsc --noEmit` 通过，eslint 无新增 error
