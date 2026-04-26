/**
 * AI 资讯列表 API
 *
 * GET /api/ai-news?date=YYYY-MM-DD&tag=llm&limit=20&offset=0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiNewsList } from '@/lib/ai-news';
import type { AiNewsListResponse } from '@/types/index';

export const revalidate = 900; // 15 分钟缓存

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get('date') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = Number(searchParams.get('offset')) || 0;

  try {
    const { items, total } = await getAiNewsList(date, tag, limit, offset);

    const response: AiNewsListResponse = {
      ok: true,
      data: {
        date: date || new Date().toISOString().split('T')[0],
        items,
        total,
        has_more: items.length === limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[api/ai-news] 查询失败:', error);
    return NextResponse.json(
      { ok: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
