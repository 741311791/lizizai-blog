/**
 * Cloudflare 服务 API 客户端
 *
 * 封装 emaction、Webviso、cf-comment 的 API 调用
 * 所有 URL 通过环境变量配置，方便部署时切换
 *
 * 服务端点：
 * - emaction: like.lihehua.xyz — 点赞/反应系统
 * - Webviso: view.lihehua.xyz — 浏览计数
 * - cf-comment: comment.lihehua.xyz — 评论系统（iframe 嵌入）
 */

// ============= 服务端点配置 =============

const EMACTION_URL = process.env.NEXT_PUBLIC_EMACTION_URL || '';
const WEBVISO_URL = process.env.NEXT_PUBLIC_WEBVISO_URL || '';
const CF_COMMENT_URL = process.env.NEXT_PUBLIC_CF_COMMENT_URL || '';

// ============= emaction（点赞/反应） =============
// API 文档: https://github.com/emaction/emaction.backend

export interface ReactionData {
  reaction_name: string;
  count: number;
}

/**
 * 获取文章所有反应数据
 */
export async function getReactions(targetId: string): Promise<ReactionData[]> {
  if (!EMACTION_URL) return [];

  try {
    const res = await fetch(`${EMACTION_URL}/reactions?targetId=${encodeURIComponent(targetId)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.reactionsGot || [];
  } catch {
    return [];
  }
}

/**
 * 获取文章总点赞数（所有反应类型的总和）
 */
export async function getLikes(targetId: string): Promise<number> {
  const reactions = await getReactions(targetId);
  return reactions.reduce((sum, r) => sum + r.count, 0);
}

/**
 * 添加/取消一个反应（客户端调用）
 */
export async function postReaction(
  targetId: string,
  reactionName: string = 'thumbs-up',
  diff: number = 1
): Promise<boolean> {
  if (!EMACTION_URL) return false;

  try {
    const res = await fetch(
      `${EMACTION_URL}/reaction?targetId=${encodeURIComponent(targetId)}&reaction_name=${encodeURIComponent(reactionName)}&diff=${diff}`,
      { method: 'PATCH' }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ============= Webviso（浏览计数） =============

/**
 * 获取文章浏览数
 */
export async function getViews(pageKey: string): Promise<number> {
  if (!WEBVISO_URL) return 0;

  try {
    const res = await fetch(`${WEBVISO_URL}/count?pageKey=${encodeURIComponent(pageKey)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.views ?? 0;
  } catch {
    return 0;
  }
}

/**
 * 批量获取多篇文章浏览数
 */
export async function getBatchViews(pageKeys: string[]): Promise<Record<string, number>> {
  if (!WEBVISO_URL || pageKeys.length === 0) return {};

  try {
    const params = pageKeys.map(k => `pageKey=${encodeURIComponent(k)}`).join('&');
    const res = await fetch(`${WEBVISO_URL}/count/batch?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * 记录页面访问（客户端调用）
 */
export async function postVisit(pageKey: string): Promise<void> {
  if (!WEBVISO_URL) return;

  try {
    await fetch(`${WEBVISO_URL}/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageKey }),
    });
  } catch {
    // 静默失败
  }
}

// ============= 服务可用性检查 =============

export function isEmactionEnabled(): boolean {
  return Boolean(EMACTION_URL);
}

export function isWebvisoEnabled(): boolean {
  return Boolean(WEBVISO_URL);
}
