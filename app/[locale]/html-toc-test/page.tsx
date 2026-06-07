'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * HTML TOC 端到端测试页面
 * 模拟 ArticleDetailClient 中 HTML 模式下的 TOC 集成逻辑
 */
export default function HtmlTocTestPage() {
  const [htmlHeadings, setHtmlHeadings] = useState<Array<{
    id: string;
    text: string;
    level: number;
    top: number;
  }>>([]);
  const [htmlActiveId, setHtmlActiveId] = useState('');
  const [iframeHeight, setIframeHeight] = useState(500);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastUpdate = useRef(0);

  const htmlUrl = '/test-html-toc.html';

  // 监听 postMessage（高度 + TOC）
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // 接受 sandbox origin "null" 和同源
      if (e.origin !== 'null' && e.origin !== window.location.origin) return;

      // 高度同步
      if (e.data?.type === 'html-content-height' && typeof e.data.height === 'number') {
        const now = Date.now();
        if (now - lastUpdate.current < 100) return;
        lastUpdate.current = now;
        setIframeHeight(e.data.height);
        setStatus('loaded');
      }

      // TOC 同步
      if (e.data?.type === 'html-toc' && Array.isArray(e.data.headings)) {
        setHtmlHeadings(e.data.headings);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // 活跃标题追踪（基于 scroll）
  useEffect(() => {
    if (htmlHeadings.length === 0) return;

    const handleScroll = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const iframeRect = iframe.getBoundingClientRect();
      const headerOffset = 100;
      const viewportTopInIframe = -iframeRect.top + headerOffset;

      let newActiveId = '';
      for (const heading of htmlHeadings) {
        if (heading.top <= viewportTopInIframe) {
          newActiveId = heading.id;
        } else {
          break;
        }
      }
      setHtmlActiveId(newActiveId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [htmlHeadings]);

  // TOC 点击跳转
  const handleHeadingClick = useCallback((headingId: string) => {
    const heading = htmlHeadings.find(h => h.id === headingId);
    const iframe = iframeRef.current;
    if (!heading || !iframe) return;
    const iframeRect = iframe.getBoundingClientRect();
    const headerOffset = 100;
    window.scrollTo({
      top: iframeRect.top + window.scrollY + heading.top - headerOffset,
      behavior: 'smooth',
    });
    setHtmlActiveId(headingId);
  }, [htmlHeadings]);

  // 超时检测
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'loading') setStatus('error');
    }, 8000);
    return () => clearTimeout(timer);
  }, [status]);

  // 将 headings 组织为树形结构
  interface HeadingGroup {
    heading: typeof htmlHeadings[0];
    index: number;
    children: typeof htmlHeadings;
  }

  const groups: HeadingGroup[] = [];
  let currentGroup: HeadingGroup | null = null;
  htmlHeadings.forEach((h) => {
    if (h.level <= 2) {
      currentGroup = { heading: h, index: 0, children: [] };
      groups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.children.push(h);
    }
  });
  groups.forEach((g, i) => { g.index = i + 1; });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">HTML TOC 端到端集成测试</h1>
      <p className="text-muted-foreground mb-8">
        测试 iframe HTML 内容的 postMessage TOC 协议与侧边栏目录集成
      </p>

      {/* 状态指示器 */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-card border border-border">
          状态: <span className={status === 'loaded' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-yellow-500'}>
            {status === 'loaded' ? '✅ 已加载' : status === 'error' ? '❌ 失败' : '⏳ 加载中'}
          </span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-card border border-border">
          TOC 标题数: <span className="text-primary font-mono">{htmlHeadings.length}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-card border border-border">
          活跃标题: <span className="text-primary font-mono text-xs">{htmlActiveId || '(无)'}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-card border border-border">
          iframe 高度: <span className="text-primary font-mono">{iframeHeight}px</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
        {/* 左栏：iframe */}
        <div>
          {status === 'error' ? (
            <div className="rounded-lg border border-red-500/50 bg-card p-8 text-center">
              <p className="text-red-400 mb-4">加载失败 — 测试 HTML 未上传到 R2</p>
              <p className="text-muted-foreground text-sm">
                需要上传 .gstack/qa-reports/test-html-toc.html 到 R2 bucket lizizai-blog/html/
              </p>
            </div>
          ) : (
            <div className="relative w-full rounded-lg overflow-hidden border border-border">
              <iframe
                ref={iframeRef}
                src={htmlUrl}
                sandbox="allow-scripts"
                title="HTML TOC 测试内容"
                className="w-full border-0"
                style={{
                  height: status === 'loaded' ? iframeHeight : 500,
                  transition: status === 'loaded' ? 'height 0.2s ease-out' : 'none',
                }}
              />
              {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右栏：TOC 侧边栏 */}
        <aside className="hidden lg:block sticky top-6 self-start border-l border-border pl-6">
          <div className="space-y-7">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                目录 (HTML TOC)
              </div>
              {htmlHeadings.length === 0 ? (
                <p className="text-sm text-muted-foreground">等待 iframe 发送 TOC 数据...</p>
              ) : (
                <nav className="space-y-1">
                  {groups.map((group) => (
                    <div key={group.heading.id}>
                      <div
                        className={`flex items-center gap-2 py-1.5 text-sm transition-colors cursor-pointer ${
                          htmlActiveId === group.heading.id
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => handleHeadingClick(group.heading.id)}
                      >
                        <span className="text-xs tabular-nums min-w-[20px] text-muted-foreground">
                          {String(group.index).padStart(2, '0')}
                        </span>
                        {group.heading.text}
                      </div>
                      {group.children.map((child) => (
                        <div
                          key={child.id}
                          className={`ml-7 py-1 text-sm transition-colors cursor-pointer ${
                            htmlActiveId === child.id
                              ? 'text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => handleHeadingClick(child.id)}
                        >
                          {child.text}
                        </div>
                      ))}
                    </div>
                  ))}
                </nav>
              )}
            </div>

            {/* 原始数据调试 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                调试数据
              </div>
              <pre className="text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border overflow-auto max-h-64">
                {JSON.stringify(htmlHeadings, null, 2)}
              </pre>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
