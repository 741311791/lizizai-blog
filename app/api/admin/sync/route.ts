import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const CF_COMMENT_URL = process.env.NEXT_PUBLIC_CF_COMMENT_URL || '';
const CF_COMMENT_PASSWORD = process.env.CF_COMMENT_PASSWORD || '';

/**
 * 为新文章自动创建 cf-comment 评论区
 */
async function ensureCommentAreas(slugs: string[]): Promise<void> {
  if (!CF_COMMENT_URL || !CF_COMMENT_PASSWORD) return;

  try {
    // 登录获取管理员权限
    const loginRes = await fetch(`${CF_COMMENT_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: CF_COMMENT_PASSWORD }),
    });
    if (!loginRes.ok) return;

    const authCookie = loginRes.headers.getSetCookie().find(c => c.includes('auth='));

    // 获取已有 areas
    const areasRes = await fetch(`${CF_COMMENT_URL}/?_extendedInfo=1`, {
      headers: authCookie ? { Cookie: authCookie.split(';')[0] } : {},
    });
    const areasData = await areasRes.json();
    const existingKeys = new Set((areasData.areas || []).map((a: { area_key: string }) => a.area_key));

    // 为缺失的文章并行创建 area
    const headers: Record<string, string> = authCookie
      ? { Cookie: authCookie.split(';')[0] }
      : {};
    const createPromises = slugs
      .filter(slug => !existingKeys.has(slug))
      .map(slug => {
        const formData = new FormData();
        formData.append('area_name', slug);
        formData.append('area_key', slug);
        formData.append('intro', `Comments for ${slug}`);

        return fetch(`${CF_COMMENT_URL}/create`, {
          method: 'POST',
          body: formData,
          headers,
        }).catch(() => {});
      });

    await Promise.allSettled(createPromises);
  } catch {
    // 创建评论区失败不影响同步结果
  }
}

export async function POST(request: NextRequest) {
  // 验证管理员会话
  const session = request.cookies.get('admin_session')?.value;
  if (session !== 'true') {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const syncUrl = process.env.NEXT_PUBLIC_SYNC_URL;
  const syncToken = process.env.NEXT_PUBLIC_SYNC_TOKEN;

  if (!syncUrl || !syncToken) {
    return NextResponse.json({ error: '同步服务未配置' }, { status: 500 });
  }

  try {
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Token': syncToken,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || data.message || '同步失败' },
        { status: res.status }
      );
    }

    // 同步成功后，为新文章自动创建评论区
    const r2Url = process.env.R2_PUBLIC_URL;
    if (r2Url && data.success) {
      try {
        const articlesRes = await fetch(`${r2Url}/blog-data/articles.json`, {
          next: { revalidate: 0 },
        });
        if (articlesRes.ok) {
          const articles = await articlesRes.json();
          const slugs = articles.map((a: { slug: string }) => a.slug);
          await ensureCommentAreas(slugs);
        }
      } catch {
        // 获取文章列表失败不影响同步结果
      }
    }

    // 同步成功后主动清除所有页面缓存，让 ISR 立即重新生成
    revalidatePath('/', 'layout');

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `同步请求失败: ${String(err)}` },
      { status: 500 }
    );
  }
}
