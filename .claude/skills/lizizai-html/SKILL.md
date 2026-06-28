# lizizai-html — lizizai-blog HTML 主题生成 Skill

生成与 lizizai-blog 设计系统视觉一致的独立 HTML 文件，供 iframe 嵌入展示。

## 触发

- 用户要求生成用于 lizizai-blog 的 HTML 内容
- 用户提到"HTML 主题"、"博客风格 HTML"、"lizizai HTML"
- `/lizizai-html`

## 核心：不可违反的规则

每份生成的 HTML **必须**包含以下四个部分，无例外：

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

### 4. HTML 内置目录（取代外部 TOC 同步）

HTML 内容**自带目录索引**，不再通过 postMessage 把标题结构传给父页面。

**为什么废弃外部 TOC 同步**：iframe 使用 `sandbox="allow-scripts"`（无 `allow-same-origin`），跨 frame 的标题位置（`offsetTop`）计算与父页面 scroll 高亮同步在动态布局（字体回流、图片懒加载、内容动态渲染）下不可靠。改为 HTML 内部直接渲染目录控件，自包含、零外部依赖、无时序竞争。

**关键设计**：
- 目录为**浮动控件**（右下角按钮 `📌` + 侧边抽屉），用 `position: fixed` 定位
- **标题跳转**用 `el.scrollIntoView()`——嵌入模式（iframe 高度=内容）下会滚动父页面，全屏模式下滚动 iframe 自身，两种模式都工作
- **活跃标题高亮**用 `IntersectionObserver`——仅在**全屏沉浸模式**下完全生效（嵌入模式 iframe 无内部滚动，IO 降级为不高亮，可接受）
- 配合父页面的**全屏按钮**，用户可进入沉浸式浏览获得最佳目录体验

**功能要求**：

| 能力 | 实现方式 |
|------|---------|
| 标题采集 | 扫描 `.prose` / `.prose-wide` / `.prose-full` 内的 h2/h3（h1 由父页面文章标题渲染，不采集） |
| ID 生成 | 标题无 id 时基于文本自动生成（去重），有则保留 |
| 目录渲染 | 浮动按钮触发，抽屉式面板列出标题，h3 缩进表示层级 |
| 跳转 | `scrollIntoView({behavior:'smooth', block:'start'})` + 标题 `scroll-margin-top` 预留顶部空间 |
| 高亮 | IntersectionObserver 追踪可见标题，激活项 primary 色高亮 |
| 重建 | MutationObserver 监听内容变更，重新采集渲染（覆盖动态内容） |
| 关闭 | 点击遮罩 / 关闭按钮 / Esc 键 |

```html
<style>
  .lz-toc-fab{position:fixed;right:20px;bottom:20px;z-index:9998;width:44px;height:44px;border-radius:50%;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:color .2s,background .2s,border-color .2s}
  .lz-toc-fab:hover{background:var(--color-surface-elevated);color:var(--color-primary);border-color:var(--color-border-hover)}
  .lz-toc-fab svg{width:20px;height:20px}
  .lz-toc-mask{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9997;opacity:0;pointer-events:none;transition:opacity .25s}
  .lz-toc-mask.open{opacity:1;pointer-events:auto}
  .lz-toc-panel{position:fixed;top:0;right:0;bottom:0;width:300px;max-width:85vw;z-index:9999;background:var(--color-surface);border-left:1px solid var(--color-border);transform:translateX(100%);transition:transform .25s ease;overflow-y:auto;padding:56px 0 24px;box-shadow:-8px 0 32px rgba(0,0,0,.3)}
  .lz-toc-panel.open{transform:translateX(0)}
  .lz-toc-title{position:absolute;top:18px;left:24px;font-family:var(--font-title);font-size:13px;font-weight:700;color:var(--color-text-muted);letter-spacing:.12em;text-transform:uppercase}
  .lz-toc-close{position:absolute;top:14px;right:16px;width:30px;height:30px;border-radius:6px;border:none;background:transparent;color:var(--color-text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center}
  .lz-toc-close:hover{background:var(--color-surface-elevated);color:var(--color-text-primary)}
  .lz-toc-close svg{width:16px;height:16px}
  .lz-toc-item{display:block;width:100%;text-align:left;padding:8px 24px;font-family:var(--font-body);font-size:14px;line-height:1.5;color:var(--color-text-secondary);background:none;border:none;border-left:2px solid transparent;cursor:pointer;transition:color .15s,background .15s}
  .lz-toc-item:hover{color:var(--color-text-primary);background:var(--color-surface-elevated)}
  .lz-toc-item.active{color:var(--color-primary);border-left-color:var(--color-primary);font-weight:600;background:var(--color-surface-elevated)}
  .lz-toc-item.lvl-3{padding-left:40px;font-size:13px}
  .prose h2,.prose h3,.prose-wide h2,.prose-wide h3,.prose-full h2,.prose-full h3{scroll-margin-top:24px}
</style>
<script>
(function () {
  var mask, panel, list, fab;

  // 采集 .prose 系列容器内的 h2/h3，自动补 id
  function collectHeadings() {
    var counter = {};
    var headings = [];
    document.querySelectorAll('.prose, .prose-wide, .prose-full').forEach(function (c) {
      c.querySelectorAll('h2, h3').forEach(function (el) {
        if (!el.id) {
          var text = (el.textContent || '').trim();
          var base = 'h-' + text.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-+|-+$/g, '') || 'h-untitled';
          var n = counter[base] || 0;
          counter[base] = n + 1;
          el.id = n === 0 ? base : base + '-' + n;
        }
        headings.push({ id: el.id, text: (el.textContent || '').trim(), level: parseInt(el.tagName.charAt(1), 10) });
      });
    });
    return headings;
  }

  // 懒构建 DOM（首次有标题时才创建）
  function ensureDom() {
    if (fab) return;
    mask = document.createElement('div'); mask.className = 'lz-toc-mask'; document.body.appendChild(mask);
    panel = document.createElement('nav'); panel.className = 'lz-toc-panel'; panel.setAttribute('aria-label', '目录');
    panel.innerHTML =
      '<div class="lz-toc-title">目录</div>' +
      '<button class="lz-toc-close" aria-label="关闭目录"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    list = document.createElement('div'); panel.appendChild(list); document.body.appendChild(panel);
    fab = document.createElement('button'); fab.className = 'lz-toc-fab'; fab.setAttribute('aria-label', '打开目录');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h12"/></svg>';
    document.body.appendChild(fab);

    fab.addEventListener('click', open);
    panel.querySelector('.lz-toc-close').addEventListener('click', close);
    mask.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function open() { panel.classList.add('open'); mask.classList.add('open'); }
  function close() { panel.classList.remove('open'); mask.classList.remove('open'); }

  // 活跃标题高亮（全屏沉浸模式下 iframe 独立滚动时生效）
  var io = null;
  function observe() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) return;
    var items = list.querySelectorAll('.lz-toc-item');
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.id;
          items.forEach(function (it) { it.classList.toggle('active', it.dataset.target === id); });
        }
      });
    }, { root: null, rootMargin: '0px 0px -70% 0px', threshold: 0 });
    document.querySelectorAll('.prose h2,.prose h3,.prose-wide h2,.prose-wide h3,.prose-full h2,.prose-full h3').forEach(function (el) { io.observe(el); });
  }

  function render() {
    ensureDom();
    var headings = collectHeadings();
    list.innerHTML = '';
    if (headings.length === 0) { fab.style.display = 'none'; return; }
    fab.style.display = 'flex';
    headings.forEach(function (h) {
      var btn = document.createElement('button');
      btn.className = 'lz-toc-item' + (h.level === 3 ? ' lvl-3' : '');
      btn.textContent = h.text;
      btn.dataset.target = h.id;
      btn.addEventListener('click', function () {
        var target = document.getElementById(h.id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        close();
      });
      list.appendChild(btn);
    });
    observe();
  }

  // 内容变更时重建（覆盖动态渲染，如日报数据注入）
  var renderTimer = null;
  function schedRender() { if (renderTimer) return; renderTimer = setTimeout(function () { renderTimer = null; render(); }, 200); }
  new MutationObserver(schedRender).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function () { setTimeout(render, 150); }); } else { setTimeout(render, 150); }
  window.addEventListener('load', function () { setTimeout(render, 300); });
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
    <!-- 正文内容：用 h2/h3 作为章节标题，内置目录会自动采集 -->
  </div>

  <!-- [必须] postMessage 高度同步 -->
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

  <!-- [必须] HTML 内置目录（浮动按钮 + 抽屉 + 高亮） -->
  <style>
    .lz-toc-fab{position:fixed;right:20px;bottom:20px;z-index:9998;width:44px;height:44px;border-radius:50%;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:color .2s,background .2s,border-color .2s}
    .lz-toc-fab:hover{background:var(--color-surface-elevated);color:var(--color-primary);border-color:var(--color-border-hover)}
    .lz-toc-fab svg{width:20px;height:20px}
    .lz-toc-mask{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9997;opacity:0;pointer-events:none;transition:opacity .25s}
    .lz-toc-mask.open{opacity:1;pointer-events:auto}
    .lz-toc-panel{position:fixed;top:0;right:0;bottom:0;width:300px;max-width:85vw;z-index:9999;background:var(--color-surface);border-left:1px solid var(--color-border);transform:translateX(100%);transition:transform .25s ease;overflow-y:auto;padding:56px 0 24px;box-shadow:-8px 0 32px rgba(0,0,0,.3)}
    .lz-toc-panel.open{transform:translateX(0)}
    .lz-toc-title{position:absolute;top:18px;left:24px;font-family:var(--font-title);font-size:13px;font-weight:700;color:var(--color-text-muted);letter-spacing:.12em;text-transform:uppercase}
    .lz-toc-close{position:absolute;top:14px;right:16px;width:30px;height:30px;border-radius:6px;border:none;background:transparent;color:var(--color-text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center}
    .lz-toc-close:hover{background:var(--color-surface-elevated);color:var(--color-text-primary)}
    .lz-toc-close svg{width:16px;height:16px}
    .lz-toc-item{display:block;width:100%;text-align:left;padding:8px 24px;font-family:var(--font-body);font-size:14px;line-height:1.5;color:var(--color-text-secondary);background:none;border:none;border-left:2px solid transparent;cursor:pointer;transition:color .15s,background .15s}
    .lz-toc-item:hover{color:var(--color-text-primary);background:var(--color-surface-elevated)}
    .lz-toc-item.active{color:var(--color-primary);border-left-color:var(--color-primary);font-weight:600;background:var(--color-surface-elevated)}
    .lz-toc-item.lvl-3{padding-left:40px;font-size:13px}
    .prose h2,.prose h3,.prose-wide h2,.prose-wide h3,.prose-full h2,.prose-full h3{scroll-margin-top:24px}
  </style>
  <script>
  (function () {
    var mask, panel, list, fab;
    function collectHeadings() {
      var counter = {}; var headings = [];
      document.querySelectorAll('.prose, .prose-wide, .prose-full').forEach(function (c) {
        c.querySelectorAll('h2, h3').forEach(function (el) {
          if (!el.id) {
            var text = (el.textContent || '').trim();
            var base = 'h-' + text.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-+|-+$/g, '') || 'h-untitled';
            var n = counter[base] || 0; counter[base] = n + 1;
            el.id = n === 0 ? base : base + '-' + n;
          }
          headings.push({ id: el.id, text: (el.textContent || '').trim(), level: parseInt(el.tagName.charAt(1), 10) });
        });
      });
      return headings;
    }
    function ensureDom() {
      if (fab) return;
      mask = document.createElement('div'); mask.className = 'lz-toc-mask'; document.body.appendChild(mask);
      panel = document.createElement('nav'); panel.className = 'lz-toc-panel'; panel.setAttribute('aria-label', '目录');
      panel.innerHTML = '<div class="lz-toc-title">目录</div><button class="lz-toc-close" aria-label="关闭目录"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
      list = document.createElement('div'); panel.appendChild(list); document.body.appendChild(panel);
      fab = document.createElement('button'); fab.className = 'lz-toc-fab'; fab.setAttribute('aria-label', '打开目录');
      fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h12"/></svg>';
      document.body.appendChild(fab);
      fab.addEventListener('click', open);
      panel.querySelector('.lz-toc-close').addEventListener('click', close);
      mask.addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
    function open() { panel.classList.add('open'); mask.classList.add('open'); }
    function close() { panel.classList.remove('open'); mask.classList.remove('open'); }
    var io = null;
    function observe() {
      if (io) io.disconnect();
      if (!('IntersectionObserver' in window)) return;
      var items = list.querySelectorAll('.lz-toc-item');
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var id = en.target.id;
            items.forEach(function (it) { it.classList.toggle('active', it.dataset.target === id); });
          }
        });
      }, { root: null, rootMargin: '0px 0px -70% 0px', threshold: 0 });
      document.querySelectorAll('.prose h2,.prose h3,.prose-wide h2,.prose-wide h3,.prose-full h2,.prose-full h3').forEach(function (el) { io.observe(el); });
    }
    function render() {
      ensureDom();
      var headings = collectHeadings();
      list.innerHTML = '';
      if (headings.length === 0) { fab.style.display = 'none'; return; }
      fab.style.display = 'flex';
      headings.forEach(function (h) {
        var btn = document.createElement('button');
        btn.className = 'lz-toc-item' + (h.level === 3 ? ' lvl-3' : '');
        btn.textContent = h.text; btn.dataset.target = h.id;
        btn.addEventListener('click', function () {
          var target = document.getElementById(h.id);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          close();
        });
        list.appendChild(btn);
      });
      observe();
    }
    var renderTimer = null;
    function schedRender() { if (renderTimer) return; renderTimer = setTimeout(function () { renderTimer = null; render(); }, 200); }
    new MutationObserver(schedRender).observe(document.documentElement, { childList: true, subtree: true });
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function () { setTimeout(render, 150); }); } else { setTimeout(render, 150); }
    window.addEventListener('load', function () { setTimeout(render, 300); });
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
- [ ] 包含 HTML 内置目录 `<style>` + `<script>`（浮动按钮、抽屉、标题采集、跳转、高亮）
- [ ] 章节标题用 h2/h3（内置目录只采集 h2/h3，h1 由父页面渲染）
- [ ] 内容包裹在 `.prose` / `.prose-wide` / `.prose-full` 容器中
- [ ] 自定义 CSS 使用 CSS 变量而非硬编码值
- [ ] 图片使用 `max-width: 100%` 防溢出
- [ ] `<html lang="zh-CN">`
- [ ] 无外部 JS/CSS 依赖（除 Google Fonts + 主题 CSS）
- [ ] 无 `<script src>` 外部脚本引用

---

## 约束与自由度

### 🔒 不可违反的约束（功能性）

以下约束确保 HTML 能正确嵌入父页面并自带目录，**无例外**：

| 约束 | 原因 |
|------|------|
| 必须包含主题 CSS `<link>` | 提供基础排版样式，否则无样式 |
| 必须包含 Google Fonts `<link>` | 保证字体与主站一致 |
| 必须包含高度同步 `<script>` | 父页面依赖此消息调整 iframe 高度 |
| 必须包含内置目录 `<style>`+`<script>` | HTML 自带目录索引，取代脆弱的跨 frame TOC 同步 |
| 内容必须在 `.prose` / `.prose-wide` / `.prose-full` 容器内 | 内置目录脚本只扫描这些容器内的标题 |
| 标题使用 h2/h3（避免 h1） | h1 由父页面文章标题渲染；内置目录采集 h2（顶级）/h3（子级） |
| 自定义 CSS 使用 CSS 变量 | `var(--color-primary)` 而非 `#d97706`，保持深色模式兼容 |
| 无外部 JS 依赖 | 文件自包含，不引入 jQuery/Chart.js 等库 |
| `<html lang="zh-CN">` | 语义正确性 |

### 🎨 不约束的内容（自由发挥）

以下方面 Agent 和用户可以自由发挥，主题 CSS 不会限制：

| 自由项 | 说明 |
|--------|------|
| **整体布局** | flex / grid / 绝对定位 / 任意 CSS 布局 |
| **自定义组件** | 卡片、图表、时间线、流程图等任意设计 |
| **动画效果** | CSS transition / animation / keyframes |
| **背景装饰** | 渐变、SVG 图案、装饰性图片 |
| **CSS 交互** | hover 效果、details/summary 折叠、:checked 状态切换 |
| **容器嵌套** | `.prose` 内嵌 `.prose-wide` 再回 `.prose`，按需切换宽度 |
| **自定义排版** | 主题 CSS 均为普通声明（无 `!important`），在 `<style>` 中写同等优先级选择器即可覆盖字号、行高、间距等 |

### 📐 约束的本质

> **约束基础设施层**（字体、颜色 token、iframe 高度协议、内置目录控件），**不约束表达层**（布局、组件设计、视觉效果）。

主题 CSS 提供的是一组**合理的默认值**，不是强制锁定。所有声明都可以通过自定义 CSS 覆盖。唯一不可覆盖的是功能性标签——主题 CSS `<link>`、字体 `<link>`、高度同步 `<script>`、内置目录 `<style>`+`<script>`，它们是功能性的，不是视觉性的。

---

## 与父页面的协作边界

HTML 内容通过 iframe 嵌入父页面，通信协议精简为**仅高度同步**（目录已由 HTML 自带）：

| 消息 | 方向 | 用途 |
|------|------|------|
| `html-content-height` | iframe → 父 | 动态调整 iframe 高度 |

父页面负责：iframe 容器、**全屏沉浸按钮**（Fullscreen API）、加载/错误状态。目录渲染、跳转、高亮全部由 HTML 内部完成，不再依赖 postMessage 传递标题。

---

## 注意事项

- 生成的 HTML 文件将被上传到 R2，通过 iframe 展示在博客文章中
- 深色模式专用，不需要考虑 light mode
- 文件自包含，不依赖 Tailwind CSS
- 主题 CSS 版本更新时需同步更新 R2 CDN 上的文件
- 完整参考示例见 `.claude/skills/lizizai-html/references/demo-reference.html`
