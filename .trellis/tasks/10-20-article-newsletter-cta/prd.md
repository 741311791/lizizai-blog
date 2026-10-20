# 文章尾部 newsletter CTA

**优先级**:P2 | **类型**:feat/转化 | **创建**:2026-10-20

## 背景

Substack publication 已上线（2026-10-16），订阅入口目前仅在列表页/页脚/订阅页。读者**读完一篇**的"内容满足点"是订阅转化率最高的位置，文章详情页尾部缺触点。

## Requirements

- 文章详情页正文末尾（评论区之前）新增轻量订阅引导条：
  - 复用 `components/ui-v2/SubscribeFormV2.tsx`（勿复制跳转逻辑，DRY）
  - 视觉与 `app/[locale]/daily-news/page.tsx` 订阅条同构（暖光 + mono Newsletter 标签 + serif 标题），编辑风容器语言
  - i18n 文案走 `messages/{zh,en}.json` `subscribe` 段，新增 `articleCtaHint`（如"喜欢这篇？邮件订阅，下一期直达收件箱"）；标题复用现有 key
- 落点：`ArticleDetailClient.tsx` 正文渲染之后（需确认渲染树位置，保持 Server 渲染路径不受影响——SubscribeFormV2 本身是 client 组件，直接嵌入即可）
- HTML/幻灯片形态文章不显示该 CTA（HTML iframe 全屏形态无正文尾概念；仅 article/podcast 形态显示）
- 约束：不加任何徽章/角标到正文；遵循 DESIGN.md

## Acceptance Criteria

- [x] article 形态文章尾部出现订阅条，表单跳转 `lizizai.substack.com/subscribe?email=`（预填生效）
- [x] html/slides 形态不出现
- [x] zh/en 双语言渲染正确
- [x] 改动文件 ESLint 零新增 error
