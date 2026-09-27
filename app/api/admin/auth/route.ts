import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkRateLimit,
  createSessionToken,
  getClientIp,
  hasValidSession,
  verifyPassword,
} from '@/lib/admin-session';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/** 检查当前会话是否有效（无副作用） */
export async function GET(request: NextRequest) {
  const authenticated = await hasValidSession(request);
  return NextResponse.json({ authenticated });
}

/** 密码验证 + 签发 HMAC 签名会话 cookie */
export async function POST(request: NextRequest) {
  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ error: '管理员密码未配置' }, { status: 500 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `尝试过于频繁，请 ${rate.retryAfterSec} 秒后重试` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (typeof password !== 'string' || !(await verifyPassword(password, ADMIN_PASSWORD))) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

/** 登出：服务端删除 httpOnly 会话 cookie */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
