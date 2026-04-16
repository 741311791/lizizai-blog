import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/** 检查当前会话是否有效（无副作用） */
export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value;
  return NextResponse.json({ authenticated: session === 'true' });
}

/** 密码验证 + 设置会话 cookie */
export async function POST(request: NextRequest) {
  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ error: '管理员密码未配置' }, { status: 500 });
  }

  const { password } = await request.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400, // 24 小时
  });

  return response;
}
