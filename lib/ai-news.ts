/**
 * AI 资讯数据访问层
 *
 * 通过 Cloudflare D1 REST API 读取资讯数据。
 * 不负责写入，写入由外部服务直接操作 D1。
 */

import { config } from '@/lib/env';
import type { AiNews, AiNewsResult } from '@/types/index';

// ============= D1 REST API 客户端 =============

interface D1Row {
  id: number;
  date: string;
  title: string;
  summary: string;
  cover_url: string;
  tags: string;       // JSON 字符串
  source_name: string;
  source_url: string;
  importance: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 执行 D1 SQL 查询
 */
async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const { cfAccountId, cfD1DatabaseId, cfD1ApiToken } = config;

  if (!cfAccountId || !cfD1DatabaseId || !cfD1ApiToken) {
    console.warn('[ai-news] D1 配置不完整，跳过查询');
    return [];
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database/${cfD1DatabaseId}/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfD1ApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
    next: { revalidate: 900 }, // 15 分钟缓存
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ai-news] D1 查询失败 (${res.status}):`, text);
    return [];
  }

  const data = await res.json();
  // D1 REST API 返回结构: { result: [{ results: [...] }] }
  const results = data?.result?.[0]?.results;
  return Array.isArray(results) ? results : [];
}

// ============= 行映射 =============

/** 将 D1 原始行映射为 AiNews 类型 */
function mapRow(row: D1Row): AiNews {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || '[]');
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    date: row.date,
    title: row.title,
    summary: row.summary || '',
    coverUrl: row.cover_url || '',
    tags,
    sourceName: row.source_name || '',
    sourceUrl: row.source_url || '',
    importance: row.importance ?? 0,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============= 查询接口 =============

/**
 * 按日期查询资讯
 */
async function queryByDate(date: string, tag?: string, limit = 50, offset = 0): Promise<AiNews[]> {
  let sql: string;
  let params: unknown[];

  if (tag) {
    // 利用 json_each 匹配 tags 数组中的值
    sql = `
      SELECT DISTINCT n.*
      FROM ai_news n, json_each(n.tags)
      WHERE n.date = ? AND json_each.value = ?
      ORDER BY n.importance DESC, n.sort_order DESC
      LIMIT ? OFFSET ?
    `;
    params = [date, tag, limit, offset];
  } else {
    sql = `
      SELECT * FROM ai_news
      WHERE date = ?
      ORDER BY importance DESC, sort_order DESC
      LIMIT ? OFFSET ?
    `;
    params = [date, limit, offset];
  }

  const rows = await queryD1<D1Row>(sql, params);
  return rows.map(mapRow);
}

/**
 * 查询最近 N 天的资讯（兜底用）
 */
async function queryRecent(beforeDate: string, days: number, tag?: string): Promise<AiNews[]> {
  let sql: string;
  let params: unknown[];

  if (tag) {
    sql = `
      SELECT DISTINCT n.*
      FROM ai_news n, json_each(n.tags)
      WHERE n.date < ? AND json_each.value = ?
      ORDER BY n.date DESC, n.importance DESC, n.sort_order DESC
      LIMIT 20
    `;
    params = [beforeDate, tag];
  } else {
    sql = `
      SELECT * FROM ai_news
      WHERE date < ?
      ORDER BY date DESC, importance DESC, sort_order DESC
      LIMIT 20
    `;
    params = [beforeDate];
  }

  const rows = await queryD1<D1Row>(sql, params);
  return rows.map(mapRow);
}

/**
 * 获取有数据的日期列表
 */
export async function getAvailableDates(limit = 30): Promise<string[]> {
  const rows = await queryD1<{ date: string }>(
    'SELECT DISTINCT date FROM ai_news ORDER BY date DESC LIMIT ?',
    [limit]
  );
  return rows.map(r => r.date);
}

/**
 * 获取资讯列表（带分页）
 */
export async function getAiNewsList(
  date?: string,
  tag?: string,
  limit = 20,
  offset = 0
): Promise<{ items: AiNews[]; total: number }> {
  const targetDate = date || getTodayString();
  const items = await queryByDate(targetDate, tag, limit, offset);

  // 获取总数（简化：不做精确 count，通过 has_more 判断）
  return { items, total: items.length };
}

// ============= 首页核心接口 =============

/**
 * 获取每日 AI 资讯（首页模块使用）
 *
 * 兜底策略：
 * 1. 当日有数据 → 正常展示
 * 2. 当日无数据 → 回退到最近有数据的日期
 * 3. D1 异常 → 静默降级
 */
export async function getDailyNews(targetDate?: string, tag?: string): Promise<AiNewsResult> {
  try {
    // 1. 优先查询指定日期
    const date = targetDate || getTodayString();
    const items = await queryByDate(date, tag);

    // 2. 当日无数据，回退到最近
    if (items.length === 0) {
      const recent = await queryRecent(date, 7, tag);
      if (recent.length > 0) {
        return { items: recent, date: recent[0].date, isFallback: true, isEmpty: false, isError: false };
      }
    }

    // 3. 完全无数据
    if (items.length === 0) {
      return { items: [], date: null, isFallback: false, isEmpty: true, isError: false };
    }

    return { items, date, isFallback: false, isEmpty: false, isError: false };
  } catch (error) {
    // 4. D1 异常，静默降级
    console.error('[ai-news] D1 query failed:', error);
    return { items: [], date: null, isFallback: false, isEmpty: false, isError: true };
  }
}

// ============= 工具函数 =============

/** 获取当天日期字符串 YYYY-MM-DD */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
