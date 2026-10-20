import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

/**
 * 动态 OG 分享卡（1200×630，编辑风排印卡）
 *
 * 服务全站文章 metadata 的 og:image：/api/og?title=...&author=...
 * 中文字体按 title 动态子集化（Google Fonts css2 API text= 参数），
 * 每篇仅拉取所需字符，进程级缓存；字体源失败时 302 回退静态 /og-image.png。
 *
 * 排版遵循 DESIGN.md：#18181b 深底 + 琥珀金点缀 + serif 标题 + mono 风小字（serif 渲染）。
 */

export const runtime = 'nodejs';

// 与站内 ISR 同频：社交爬虫重复抓取由 CDN 缓存吸收
export const revalidate = 3600;

const SITE_LABEL = 'LIZIZAI';
const SITE_URL_TEXT = 'lizizai.xyz';
const DEFAULT_AUTHOR = '李自在';

/** 进程级字体子集缓存：text 集合 → ArrayBuffer */
const fontCache = new Map<string, ArrayBuffer>();

/**
 * 取 Google Fonts 动态子集（Noto Serif SC 700，ttf）。
 * css2 API 不带 UA 头时返回 ttf 直链（satori 仅支持 ttf/otf）。
 */
async function fetchSubsetFont(text: string): Promise<ArrayBuffer | null> {
  const cacheKey = text;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  try {
    const cssUrl =
      `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700` +
      `&text=${encodeURIComponent(text)}`;
    const cssRes = await fetch(cssUrl, { signal: AbortSignal.timeout(10_000) });
    if (!cssRes.ok) return null;

    const css = await cssRes.text();
    // 无 UA 时 css2 返回 ttf 直链，URL 形如 https://fonts.gstatic.com/l/font?kit=...（无 .ttf 扩展名）
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/);
    if (!match) return null;

    const fontRes = await fetch(match[1], { signal: AbortSignal.timeout(15_000) });
    if (!fontRes.ok) return null;

    const buf = await fontRes.arrayBuffer();
    if (fontCache.size > 50) fontCache.clear(); // 简单防膨胀
    fontCache.set(cacheKey, buf);
    return buf;
  } catch {
    return null;
  }
}

/** 标题截断：56px 字号下每行约 18 全角字符，52 字稳定控制在 3 行内 */
function clampTitle(title: string): string {
  return title.length > 52 ? `${title.slice(0, 51)}…` : title;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = clampTitle((searchParams.get('title') || '').trim());
  const author = (searchParams.get('author') || '').trim() || DEFAULT_AUTHOR;

  if (!title) {
    return new Response('Missing title', { status: 400 });
  }

  // 子集字符集：标题 + 署名 + 站点标识 + 装饰符号
  const glyphs = Array.from(new Set(`${title}${author}${SITE_LABEL}${SITE_URL_TEXT}◆`)).join('');
  const fontData = await fetchSubsetFont(glyphs);

  // 字体源不可用：回退静态站图，保证 og:image 永不 404/豆腐
  if (!fontData) {
    return Response.redirect(new URL('/og-image.png', request.nextUrl.origin), 302);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#18181b',
          backgroundImage:
            'radial-gradient(700px 260px at 12% -8%, rgba(217,119,6,0.12), transparent 70%)',
          fontFamily: 'Noto Serif SC',
        }}
      >
        {/* 顶部：mono 风站点标识（serif 渲染，编辑风报刊头） */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 26, color: '#d97706', letterSpacing: 6 }}>{SITE_LABEL}</span>
          <span
            style={{
              width: 220,
              height: 1,
              backgroundColor: 'rgba(217,119,6,0.35)',
            }}
          />
        </div>

        {/* 中部：标题（垂直居中，自动换行） */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            maxHeight: 330,
          }}
        >
          <p
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.35,
              color: '#fafaf9',
              margin: 0,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
            }}
          >
            {title}
          </p>
        </div>

        {/* 底部：作者署名 + 站点 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, color: '#d97706' }}>◆</span>
            <span style={{ fontSize: 26, color: '#a8a29e' }}>{author}</span>
          </div>
          <span style={{ fontSize: 24, color: '#a8a29e', letterSpacing: 2 }}>{SITE_URL_TEXT}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Noto Serif SC',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );
}
