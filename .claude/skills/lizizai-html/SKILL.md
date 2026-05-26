# lizizai-html — lizizai-blog HTML 主题生成 Skill

生成与 lizizai-blog 设计系统视觉一致的独立 HTML 文件，供 iframe 嵌入展示。

## 触发

- 用户要求生成用于 lizizai-blog 的 HTML 内容
- 用户提到"HTML 主题"、"博客风格 HTML"、"lizizai HTML"
- `/lizizai-html`

## 核心：不可违反的规则

每份生成的 HTML **必须**包含以下三个部分，无例外：

### 1. 主题 CSS 引用

```html
<link rel="stylesheet" href="https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev/themes/lizizai-blog-theme.css">
```

### 2. Google Fonts 加载（保证字体一致）

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;700;900&family=Instrument+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3. postMessage 高度同步脚本

父页面 iframe 使用 `sandbox="allow-scripts"`（无 `allow-same-origin`），iframe 的 origin 为 `"null"`。父页面已适配此场景。脚本必须覆盖以下动态高度场景：

| 场景 | 处理方式 |
|------|---------|
| 初始渲染 | `DOMContentLoaded` + `load` 双重保障 |
| 字体加载回流 | ResizeObserver 监听 body 尺寸变化 |
| 图片懒加载 | MutationObserver 监听新 DOM 节点 + img load 事件 |
| 动态内容 | MutationObserver subtree 监听 |
| CSS 动画/过渡 | ResizeObserver 持续监听 |

```html
<script>
(function() {
  function sendHeight() {
    var h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.parent.postMessage({ type: 'html-content-height', height: h }, '*');
  }

  // 节流：100ms 内只发送一次，避免高频更新
  var timer = null;
  function throttledSend() {
    if (timer) return;
    timer = setTimeout(function() { timer = null; sendHeight(); }, 100);
  }

  // DOM + 尺寸变更监听（覆盖字体回流、动态内容、CSS 动画）
  new MutationObserver(throttledSend)
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  new ResizeObserver(throttledSend)
    .observe(document.body);

  // 图片加载后重新计算（覆盖懒加载）
  document.addEventListener('load', function(e) {
    if (e.target.tagName === 'IMG') throttledSend();
  }, true);

  // 首次渲染保障：DOMContentLoaded + load 双重发送
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(sendHeight, 50); });
  } else {
    setTimeout(sendHeight, 50);
  }
  window.addEventListener('load', function() { setTimeout(sendHeight, 100); });
})();
</script>
```

### HTML 最小骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面标题</title>
  <!-- 字体预连接 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;700;900&family=Instrument+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
  <!-- 主题样式 -->
  <link rel="stylesheet" href="https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev/themes/lizizai-blog-theme.css">
  <!-- 内容自定义样式 -->
  <style>
    /* 在此添加页面特定的样式 */
  </style>
</head>
<body>
  <!-- 内容区域 -->
  <div class="prose">
    <!-- 正文内容 -->
  </div>

  <!-- postMessage 高度同步 -->
  <script>
  (function() {
    function sendHeight() {
      var h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      window.parent.postMessage({ type: 'html-content-height', height: h }, '*');
    }
    var timer = null;
    function throttledSend() {
      if (timer) return;
      timer = setTimeout(function() { timer = null; sendHeight(); }, 100);
    }
    new MutationObserver(throttledSend)
      .observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    new ResizeObserver(throttledSend)
      .observe(document.body);
    document.addEventListener('load', function(e) {
      if (e.target.tagName === 'IMG') throttledSend();
    }, true);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(sendHeight, 50); });
    } else {
      setTimeout(sendHeight, 50);
    }
    window.addEventListener('load', function() { setTimeout(sendHeight, 100); });
  })();
  </script>
</body>
</html>
```

---

## 渐进式披露

### Level 1 — 直接生成（默认）

用户只提供内容描述，Agent 直接输出完整 HTML。

**Agent 行为：**
- 使用最小骨架模板
- 内容包裹在 `<div class="prose">` 中
- 自动使用语义化 HTML 标签（h2/h3/p/ul/blockquote/code 等）
- 主题 CSS 自动处理所有排版样式
- 无需用户做任何样式决策

**输出：** 一个完整的、可直接上传 R2 的 HTML 文件。

### Level 2 — 主题组件使用

当内容包含特定结构（数据、卡片、提示框等）时，Agent 主动使用主题提供的组件类。

**可用组件类：**

| 组件 | 类名 | 用途 |
|------|------|------|
| 阅读容器（窄） | `.prose` | 680px 居中，文章正文 |
| 宽容器 | `.prose-wide` | 960px，图表/数据展示 |
| 全宽容器 | `.prose-full` | 100% 宽度 |
| 卡片 | `.card` | 带边框的容器块 |
| 标签 | `.badge` / `.badge--primary` | 小型标签 |
| 按钮 | `.btn` / `.btn--primary` | 操作按钮 |
| 数据表格 | `.data-table` | 带样式的表格 |
| 提示框 | `.callout--info/warning/error/success` | 带颜色的提示块 |
| 分隔符 | `.divider` | 带文字的分割线 |

**Agent 判断规则：**
- 有数据对比 → 用 `.data-table`
- 有重点提示 → 用 `.callout--*`
- 有并列信息块 → 用 `.card`
- 图表/可视化需要更宽空间 → 用 `.prose-wide`
- 默认 → 用 `.prose`

### Level 3 — 自定义样式

当默认主题组件不足以表达内容时，Agent 在 `<style>` 中编写自定义 CSS。

**规则：**
- **必须**引用 CSS 变量而非硬编码颜色值
- 使用 `var(--color-primary)` 而非 `#d97706`
- 使用 `var(--space-lg)` 而非 `24px`
- 使用 `var(--radius-md)` 而非 `8px`
- 保持深色模式兼容（背景始终使用 `--color-background` 或 `--color-surface` 系列）

**示例：**
```css
.custom-chart-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.custom-highlight {
  color: var(--color-primary);
  font-family: var(--font-mono);
}
```

---

## 设计 Token 速查

### 颜色

| Token | 值 | 用途 |
|-------|----|------|
| `--color-background` | #09090b | 页面背景 |
| `--color-surface` | #18181b | 卡片/容器背景 |
| `--color-surface-elevated` | #27272a | 悬浮/激活背景 |
| `--color-text-primary` | #fafaf9 | 标题、强调文字 |
| `--color-text-secondary` | #a8a29e | 正文文字 |
| `--color-text-muted` | #78716c | 辅助信息、时间戳 |
| `--color-primary` | #d97706 | 琥珀金强调色（链接、高亮） |
| `--color-primary-hover` | #f59e0b | 强调色 hover 态 |
| `--color-border` | #27272a | 分隔线 |
| `--color-border-hover` | #3f3f46 | hover 态边框 |

### 字体

| Token | 字体 | 用途 |
|-------|------|------|
| `--font-title` | Noto Serif SC | 标题（h1-h6） |
| `--font-body` | Noto Sans SC | 中文正文 |
| `--font-body-en` | Instrument Sans | 英文正文 |
| `--font-mono` | Geist Mono | 代码 |

### 间距

| Token | 值 | 典型用途 |
|-------|----|---------|
| `--space-2xs` | 4px | 图标间距 |
| `--space-xs` | 8px | 紧凑间距 |
| `--space-sm` | 12px | 小间距 |
| `--space-md` | 16px | 标准间距 |
| `--space-lg` | 24px | 段落间距 |
| `--space-xl` | 32px | 区块间距 |
| `--space-2xl` | 48px | 大区块间距 |

### 排版规范

| 元素 | 字号 | 字重 | 行高 |
|------|------|------|------|
| h1 | 32px | 900 | 1.35 |
| h2 | 24px | 700 | 1.4 |
| h3 | 20px | 700 | 1.4 |
| 正文 | 17px | 400 | 1.8 |
| 小字 | 13-14px | 400 | 1.5 |
| 代码 | 14px | 400 | 1.7 |

---

## 输出验证清单

生成 HTML 后，Agent 必须自检以下项目：

- [ ] 包含 `<link>` 引用主题 CSS（CDN 地址正确）
- [ ] 包含 Google Fonts `<link>`
- [ ] 包含 postMessage 高度同步 `<script>`
- [ ] 内容包裹在 `.prose` / `.prose-wide` / `.prose-full` 容器中
- [ ] 自定义 CSS 使用 CSS 变量而非硬编码值
- [ ] 图片使用 `max-width: 100%` 防溢出
- [ ] `<html lang="zh-CN">`
- [ ] 无外部 JS/CSS 依赖（除 Google Fonts + 主题 CSS）
- [ ] 无 `<script src>` 外部脚本引用

---

## 注意事项

- 这是**纯主题样式参照 SKILL**，不负责布局逻辑
- 生成的 HTML 文件将被上传到 R2，通过 iframe 展示在博客文章中
- 深色模式专用，不需要考虑 light mode
- 文件自包含，不依赖 Tailwind CSS
- 主题 CSS 版本更新时需同步更新 R2 CDN 上的文件
