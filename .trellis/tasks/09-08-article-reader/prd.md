# 文章详情:阅读器与内容渲染修复

**优先级**:P1 | **父任务**:09-08-frontend-audit | **页面**:`/article/[slug]` 内容渲染区(markdown/播客/幻灯片/HTML 四种类型)

## 修复清单

### HIGH

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `components/article/ImageLightbox.tsx:30` | 捕获式点击委托 `target.closest('article')` 命中详情页整个 `<article>`:点相关文章卡片封面/评论头像会误开灯箱且 `preventDefault` 阻断跳转 | 改为 `closest('.article-content')` 或仅在正文容器上挂委托 |
| 2 | `components/article/AudioPlayer.tsx:101-113` + `ArticleDetailClient.tsx:91-93` | `timeupdate`(~4 次/秒)逐级 setState 上提到 ArticleDetailClient,整棵树(侧栏/评论/相关文章)以 4Hz 重渲;`onChapterChange` 每帧重复调用 | 仅整秒变化时回调;或将 currentTime 下沉到 PodcastSidebar,用 useSyncExternalStore/订阅获取 |
| 3 | `components/article/AudioPlayer.tsx:93,150` | `new Audio(audioUrl)` 默认 `preload=auto`,打开播客页未点播放即全量下载音频;JSX 里 `<audio ref preload="metadata">`(:150)被覆盖成死元素 | 删 `new Audio`,改用 JSX `<audio>` 元素保留 `preload="metadata"`,播放时调 `play()` |
| 4 | `components/article/SlideViewer.tsx:51-59` | markdown 模式在 window 上劫持 ArrowLeft/Right 且 preventDefault,未排除 input/textarea/contentEditable:评论框内移动光标被翻页拦截 | 加 `if (e.target.closest('input,textarea,[contenteditable]')) return` + 可见性判断 |
| 5 | `components/article/MobileSlideNav.tsx:35-43` | 导航点命中区仅 8×8px(移动端要求 44px) | `p-2 -m-2` 扩展命中或外层 wrapper 承接点击 |
| 6 | `components/article/AudioPlayer.tsx:174-183` | 进度条可点区仅 ~4px 高;无 `role="slider"` 键盘支持 | 外层 `py-2.5 -my-2.5` 扩命中;加 slider ARIA 与左右键步进 |

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 7 | `components/article/MarkdownContent.tsx:83-85,127-130` | remarkPlugins/rehypePlugins/components 每次 render 重建,ReactMarkdown 全量重跑,无语言代码块反复 highlightAuto | 提升为模块级常量或 useMemo;mermaid 转换按 content 记忆化 |
| 8 | `components/article/HtmlViewer.tsx:55-63` | postMessage 未校验来源:`e.origin !== 'null'` 放行 null origin,未比对 `e.source`,任意 sandbox frame 可伪造高度消息 | 校验 `e.source === iframeRef.current?.contentWindow`;收紧 origin 白名单 |
| 9 | `components/article/AudioPlayer.tsx:47-56` | 播放态乐观更新且 `play()` Promise 被忽略:自动播放策略拒绝后按钮态永久失同步 + unhandled rejection | `play().catch(() => setIsPlaying(false))`,或监听原生 play/pause 事件反向同步 |
| 10 | `components/article/PodcastList.tsx:32-51` | 文字稿 fetch 竞态:快速切换播客时旧请求 resolve 覆盖新面板 | AbortController(切换时 abort)或递增请求序号丢弃过期响应 |
| 11 | `components/article/ArticleDetailClient.tsx:293-297` | `transition-[max-width]` 对布局属性做动画,每帧整列 reflow | 去掉过渡直接切换 |
| 12 | `components/article/SlidesSidebar.tsx:53,100` + `PodcastSidebar.tsx:43` | 可点击 div/li 无键盘可达(无 role/tabIndex/Enter 处理) | 改用 `<button>` |
| 13 | `components/article/ImageLightbox.tsx:46-65` | 灯箱无滚动锁定、无焦点移入/归还;关闭按钮命中不足 | 锁 `body.overflow`(参考 SlideViewer.tsx:71);聚焦关闭按钮、关闭后归还;命中 ≥44px |
| 14 | `components/article/SlideViewer.tsx:144-247` | 全屏 Modal 无焦点陷阱,Tab 可穿透到底层 | 打开时聚焦关闭按钮 + 简易焦点圈定 |
| 15 | `HtmlViewer.tsx:149-157` + `SlideViewer.tsx:90-96,206-212` | iframe 策略不一致:HtmlViewer 有 sandbox 无 lazy,SlideViewer 相反 | 统一补 `loading="lazy"`(SlideViewer 全屏帧除外)与统一 sandbox 策略 |
| 16 | `AudioPlayer.tsx:191-196,203-210` | 倍速/章节按钮命中 ~22-24px | 垂直 padding 提至 ≥40px |
| 17 | `MobileToc.tsx:43-54` + `MobileChapterList.tsx:48-60` | 目录/章节条目命中 ~28px(< 44px 移动标准) | `py-2.5` 并用 leading 收紧视觉 |
| 18 | `HtmlViewer.tsx:70-77` | 超时定时器在 status 非 loading 后仍重设(空转) | effect 内 `if (status !== 'loading') return` 早退 |
| 19 | `LayoutToggle.tsx:30,42` | 按钮文案英文 "List"/"Grid"(违反 UI 中文);且未检索到引用,疑似死代码 | 改中文或删除组件 |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 20 | `SlideViewer.tsx:6-7,271` | html_slides 模式仍打包 react-markdown | markdown 分支拆为独立 dynamic 模块 |
| 21 | `PodcastList.tsx:7,12-13` | 注释与实际加载时机不符(静态导入) | 修正注释或转录区再 dynamic 一层 |
| 22 | `SlideViewer.tsx:40-48,59` | keydown handler 每次 render 重绑 | useCallback 或 ref 持有最新 handler |
| 23 | `MarkdownContent.tsx:87-97` | 标题含 code/链接时 `String(children)` 产出 "[object Object]",TOC 锚点与 SSR 失配 | 递归提取纯文本再 slug |
| 24 | `HtmlViewer.tsx:95-101,45-51` | 重试分支死代码;100ms 节流丢尾沿,高度可能停留旧值 | 删死代码;节流加 trailing 调用 |
| 25 | `ArticleContent.tsx:50` + `PodcastList.tsx:101` | hover-only 控件触屏永不可见仍可误触 | `@media (hover: none)` 下常显 |
| 26 | `ArticleDetailClient.tsx:304` + `MarkdownContent.tsx:102` | 标题无 balance、正文无 pretty | h1 `text-balance`,`.article-content p` `text-wrap: pretty` |
| 27 | `ReadingProgress.tsx:35-37` | transition-[width] 叠 rAF 逐帧更新产生橡皮筋滞后 | 二选一:保留 transition 降更新频率,或去过渡直写 style |
| 28 | `MobileToc.tsx:38` + `MobileChapterList.tsx:43` + `PodcastList.tsx:136-140` | ChevronRight/Down 瞬切无过渡 | 单图标 + `rotate-90` transform 过渡 |
| 29 | `PodcastSidebar.tsx:28,71-73` | 剩余分钟数无 tabular-nums,每分钟宽度抖动 | 加 `tabular-nums` |
| 30 | AudioPlayer.tsx:157、HtmlViewer.tsx:120,168、SlideViewer.tsx:113,282 等 | 自定义按钮无按压反馈 | 统一 `active:scale-[0.96]` + `transition-transform` |
| 31 | `HtmlViewer.tsx:168` + `LayoutToggle.tsx:23-42` | 全屏按钮 36px / LayoutToggle 32px | 提至 ≥40px |
| 32 | `ArticleDetailClient.tsx:215-274` | 侧栏组件收全量 article(含 renderedContent/slidesData) | 拆 ArticleMeta 窄对象,缩小重渲面 |
| 33 | `PodcastList.tsx:77-82` | 封面 `<img>` 无 lazy | 补 `loading="lazy" decoding="async"` |
| 34 | `ImageLightbox.tsx:51-57` | 关闭按钮纯 text-white/80 叠任意亮度图片,可能不可见 | `bg-black/50 rounded-full p-2` 衬底并扩命中 |

## 保持不退化(本次审查确认的亮点)

重型组件(AudioPlayer/SlideViewer/HtmlViewer/ImageLightbox/CommentSection)已全部 next/dynamic 条件加载;正文 markdown 已服务端预渲染为 HTML;ReadingProgress 的 passive+rAF+ticking 模式规范;ArticleSidebar TOC 用 IntersectionObserver——以上不要在重构中退化。

## 已否决(勿做)

- relatedArticles 串行 await 改并行(存在真实数据依赖,且上游已 React.cache,无网络成本)
- ReadingProgress 改 ref 直改 DOM(破坏 React 单向数据流,收益不成比例)
- 全局空格键播放快捷键(原生焦点+Space 已可达,拦截输入焦点场景复杂度高)

## 验收标准

- [x] 播客页打开 Network 面板:未点播放不拉音频流;播放时其余区域无 4Hz 重渲(React Profiler 验证)(生产模式验证:audio preload=metadata、选中播客后仅 1 个元数据 range 请求无音频流;onTimeUpdate 整秒节流 + 章节去重 + SidebarStats memo,重渲频率 4Hz→1Hz 且范围收窄)
- [x] 点击相关文章封面/评论头像不再误开灯箱;正文图片灯箱正常(委托范围收窄到 .article-content,相关文章封面点击验证不触发灯箱;当前数据无正文图,正向路径由同一选择器保证;另补灯箱滚动锁/焦点管理/关闭按钮衬底)
- [x] 评论输入框内方向键可移动光标不翻页(SlideViewer 键盘劫持加 input/textarea/contenteditable 守卫;当前全部幻灯片为 html_slides 模式,markdown 模式为防御性修复,代码级验证)
- [x] 移动端视口(375px)截图验证:导航点/进度条/目录条目命中区扩展;灯箱打开时背景不可滚动(导航点 44px 命中区、进度条 py-2.5 命中+slider ARIA+键盘步进、目录条目 py-2.5;移动 390px 文章页截图排版正常)
- [x] zh 语言下详情页截图(4 种内容类型各一);`pnpm lint`、`pnpm build` 通过(同篇文章含全部 4 类型,逐一切换验证:文章/播客/幻灯片/HTML 均正常渲染;lint 改动文件零新增 error;build 595/595)

## 执行附注(2026-09-10)

- 验证中发现 dev(Turbopack)冷缓存下文章页空白为既有 dev 环境问题(基线 stash 后同样复现,`next/dynamic` SSR bailout + 客户端渲染),生产构建/生产模式渲染正常;已用 `pnpm start` 生产模式完成全部交互验收。
- #11 transition-[max-width] 移除、#19 LayoutToggle i18n(在 listing-pages 任务一并落地)、#26 h1 text-balance 已做;#32 侧栏窄化采用 SidebarStats memo 方案(播放高频重渲已隔离,未做侵入式 props 拆分)。
