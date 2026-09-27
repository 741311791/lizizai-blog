# 首页性能与体验修复

**优先级**:P1 | **父任务**:09-08-frontend-audit | **页面**:`/`(Hero、DailyNews、AboutMe、ArticlesSection、loading 骨架)

**注意**:`ArticlesSection.tsx` / `ArticleCard.tsx` / `ArticleListItem.tsx` 中卡片结构类问题归 `09-08-shared-cards`;本任务管首页特有的行为与性能问题。

## 修复清单

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `components/home/AboutMe.tsx:18-24` | 首屏外(第 4 区块)头像标 `priority` 抢占 LCP 带宽;`fill` 无 `sizes` 默认按 100vw 取图(实际最大显示 280px) | 去掉 priority;补 `sizes="(max-width: 1024px) 208px, 280px"` |
| 2 | `app/[locale]/loading.tsx:23-36` | 首页骨架与真实布局不一致:缺「每日资讯」横条(真实页 DailyNews.tsx:29-60)、缺 ArticlesSection 的 TabsList/视图切换头,文章骨架 3 行纯文本 vs 真实列表行右侧 160px 缩略图+类型徽标 → 加载完成跳变 | 骨架补 DailyNews 高度占位与 tab 行;右图高度对齐 |
| 3 | `components/article/ArticlesSection.tsx:70-89` | 网格/列表切换 icon-only 按钮无 aria-label/aria-pressed,命中区 ~26×26px | 加 `aria-label`/`aria-pressed`;padding 提到 p-2.5 以上(≥40px) |
| 4 | `lib/blog-data.ts:22-24` + `app/[locale]/page.tsx:17,23` | R2 拉取失败静默返回 [],首页退化为"空站"(Hero 不渲染)且负结果被 ISR 缓存 1 小时,无任何错误提示 | 失败时 throw 交 error.tsx 呈现重试,或渲染明确错误横幅(数据层修复,列表页任务验收覆盖) |
| 5 | `components/article/ArticlesSection.tsx:104-105,140-156` | 「热门」Tab 加载骨架固定为网格样式,默认视图是列表,加载后形态跳变 | 按 viewMode 渲染列表骨架(复用 ArticleList 行结构) |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 6 | `components/home/DailyNews.tsx:34-37` | 脉冲圆点 `animate-ping` 无限循环,违背 minimal-functional 基调,常驻消耗合成资源无信息增量 | 保留静态金点;或仅数据更新时短促 ping 一次 |
| 7 | `components/home/DailyNews.tsx:52` | `snap-x snap-mandatory` 强制吸附与触控板自由滚动打架,且隐藏滚动条后无翻页指示 | 改 `snap-proximity`;容器加 `tabindex=0` 支持方向键滚动 |
| 8 | `components/home/Hero.tsx:47` | Hero 图 sizes 高估:1920 屏按 60vw≈1152px 取图,实际显示约 750px | `sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 60vw, 750px"` |
| 9 | `components/article/ArticleCard.tsx:76-87` | 卡片 meta 行计数/日期数字无 tabular-nums,基线抖动 | 加 `tabular-nums`(shared-cards 任务落地,此处验收) |

## 硬性约束

- **Hero 图与封面图不得添加任何徽章、标签、角标**(项目既定约定,改版时严禁引入)。
- 设计系统动效基线 minimal-functional:高频交互(横滑卡片、tab 切换)禁止入场 stagger 动画。

## 已否决(勿做)

- ArticlesSection 首页挂载即预取浏览量:刻意的预取设计(文件头注释明确),目的是保住 ISR 静态,有骨架兜底,非缺陷
- lucide-react barrel 优化:next.config.ts 已配 optimizePackageImports,风险已消解
- Hero blurDataURL 占位色 #1a1a2e 偏蓝:仅加载百毫秒窗口可见,收益过低

## 验收标准

- [x] Lighthouse/DevTools:首页 LCP 图片为 Hero 图且有 priority;AboutMe 头像非 eager(Next 16 priority 机制:head `<link rel=preload as=image>` + img 无 lazy;头像 loading=lazy + sizes 正确)
- [x] 刷新首页:骨架各区块高度与真实布局一致,无跳变(录屏或截图对照)(骨架补齐 DailyNews 横条/Tabs 头/缩略图 96/160px 尺寸,结构与真实布局逐区块对齐)
- [x] 断开 R2(改错 env)时首页显示错误态而非空站(临时改 R2_BASE 验证:「出错了」+重试+回到首页;首页与列表页共享数据层)
- [x] 移动端视口横滑 DailyNews 无强制吸附卡顿(snap-proximity + tabindex 键盘可达 + 静态金点替代常驻 ping)
- [x] `pnpm lint`、`pnpm build` 通过;桌面+移动、zh+en 截图验证(ArticlesSection 的 set-state-in-effect 基线 error 顺手修复;build 595/595)
