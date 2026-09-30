'use client';

import { useEffect, useRef } from 'react';

/**
 * 卡片间 PCB 光束连线：读取各卡片实际位置，动态绘制折线 + 端点光斑。
 * 布局/resize 变化时重绘；仅作用于 Bento 主网格容器。
 */
export default function ResumeBeams() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const main = document.getElementById('rz-work');
    if (!svg || !main) return;

    const draw = () => {
      const mr = main.getBoundingClientRect();
      svg.setAttribute('width', String(Math.round(mr.width)));
      svg.setAttribute('height', String(Math.round(mr.height)));
      svg.setAttribute('viewBox', `0 0 ${mr.width} ${mr.height}`);

      const q = (n: string) => {
        const el = main.querySelector<HTMLElement>(`[data-beam="${n}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { l: r.left - mr.left, r: r.right - mr.left, t: r.top - mr.top, h: r.height };
      };
      const A = q('agent');
      const D = q('data');
      const T = q('timeline');
      if (!A || !D || !T) return;

      // 桌面双栏才绘制（单栏堆叠时 gutter 不存在）
      if (T.l <= A.r + 8) return;

      const gapMid = (A.r + T.l) / 2;
      const routes: { pts: number[][]; dots: number[][] }[] = [
        // 卡1 右边 -> 时间线卡左边（上部）
        {
          pts: [[A.r + 2, A.t + A.h * 0.32], [gapMid + 16, A.t + A.h * 0.32], [gapMid, A.t + A.h * 0.32 - 16], [gapMid, A.t + 24], [T.l - 2, A.t + 24]],
          dots: [[A.r + 2, A.t + A.h * 0.32], [T.l - 2, A.t + 24]],
        },
        // 卡1 底边 -> 卡2 顶边（左 gutter）
        {
          pts: [[110, A.t + A.h + 2], [110, A.t + A.h + 22], [126, A.t + A.h + 38], [126, D.t - 2]],
          dots: [[110, A.t + A.h + 2], [126, D.t - 2]],
        },
        // 卡2 右上 -> 时间线卡（中部）
        {
          pts: [[D.r + 2, D.t + 70], [gapMid - 10, D.t + 70], [gapMid - 10, D.t + 86], [T.l - 2, D.t + 86]],
          dots: [[D.r + 2, D.t + 70], [T.l - 2, D.t + 86]],
        },
      ];

      let s = '';
      for (const rt of routes) {
        s += `<polyline points="${rt.pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="rgba(255,158,47,.95)" stroke-width="2" style="filter:drop-shadow(0 0 6px rgba(255,160,60,.95))"/>`;
        for (const d of rt.dots) {
          s += `<circle cx="${d[0]}" cy="${d[1]}" r="4.5" fill="#FFB25E" style="filter:drop-shadow(0 0 10px rgba(255,190,100,1))"/>`;
        }
      }
      svg.innerHTML = s;
    };

    draw();
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(draw, 150);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-visible"
    />
  );
}
