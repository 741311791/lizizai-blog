import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * 按需清除 ISR 与数据缓存，供 GitHub Actions 同步成功后调用。
 *
 * 背景：同步只更新 R2，Vercel 侧的 fetch 数据缓存（revalidate 3600s）与 ISR 页面缓存
 * 不会自动感知——新文章在缓存窗口内读到旧的 articles.json，触发 notFound() → 404 且被
 * ISR 缓存。同步后主动调本接口清缓存，新内容下次请求即更新。
 *
 * 鉴权：Authorization: Bearer <ADMIN_PASSWORD>，或 x-vercel-cron-secret（与 /api/admin/sync 一致）。
 *
 * 选 revalidatePath 而非 revalidateTag：Next.js 16 的 revalidateTag 需传 cacheLife profile
 * （第二参数）且为 stale-while-revalidate 语义；revalidatePath('/', 'layout') 直接清根 layout
 * 下所有路由的 Data Cache 与 Full Route Cache，更适合「同步后立即全量刷新」。
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-vercel-cron-secret');
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cronSecretEnv = process.env.CRON_SECRET;

  const isBearer = !!adminPassword && authHeader === `Bearer ${adminPassword}`;
  const isCron = !!cronSecretEnv && cronSecret === cronSecretEnv;

  if (!isBearer && !isCron) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 清除根 layout 下所有路由的缓存（Data Cache + Full Route Cache），
  // 让首页 / 分类 / 文章页等下次请求时重新拉取 R2 最新数据
  revalidatePath('/', 'layout');

  return NextResponse.json({ revalidated: true, time: Date.now() });
}
