/**
 * AI 资讯可用日期列表 API
 *
 * GET /api/ai-news/dates?limit=30
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableDates } from '@/lib/ai-news';
import type { AiNewsDatesResponse } from '@/types/index';

export const revalidate = 900; // 15 分钟缓存

export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 30, 100);

  try {
    const dates = await getAvailableDates(limit);

    const response: AiNewsDatesResponse = {
      ok: true,
      data: { dates },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[api/ai-news/dates] 查询失败:', error);
    return NextResponse.json(
      { ok: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
