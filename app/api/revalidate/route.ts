import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * 按需清除 ISR 与数据缓存，供 GitHub Actions 同步成功后调用。
 *
 * 背景：同步只更新 R2，Vercel 侧的 fetch 数据缓存（revalidate 3600s）与
 * ISR 页面缓存不会自动感知——新文章在缓存窗口内会读到旧的 articles.json，
 * 触发 notFound() → 404 且被 ISR 缓存。同步后主动调本接口清缓存，新内容秒级可见。
 *
 * 鉴权：Authorization: Bearer <ADMIN_PASSWORD>，或 x-vercel-cron-secret（与 /api/admin/sync 一致）。
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

  // 清除数据缓存：fetch 按 tag 标记（见 lib/blog-data.ts），
  // 仅 revalidatePath 清不掉 Data Cache，必须靠 revalidateTag 才能让陈旧的
  // articles.json 失效
  revalidateTag('articles');
  revalidateTag('categories');
  revalidateTag('article-content');

  // 双保险：清除全站 ISR 页面缓存，确保页面立即重新生成
  revalidatePath('/', 'layout');

  return NextResponse.json({ revalidated: true, time: Date.now() });
}
