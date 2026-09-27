import { NextRequest } from 'next/server';

/**
 * Admin 会话管理：签发 HMAC 签名 token，校验签名 + 过期时间，
 * 防止伪造 `admin_session=true` 之类字面量 cookie 绕过认证。
 */

export const SESSION_COOKIE = 'admin_session';
/** 会话有效期（秒）：24 小时 */
export const SESSION_MAX_AGE = 86400;

function getSecret(): string {
  // 优先用独立密钥；未配置时从管理员密码派生（改密码即全员会话失效）
  return process.env.ADMIN_SESSION_SECRET || `derived:${process.env.ADMIN_PASSWORD ?? ''}`;
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return hexEncode(new Uint8Array(sig));
}

/** 常数时间字符串比较（等长 hex 摘要），避免时序侧信道 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return hexEncode(new Uint8Array(digest));
}

/** 常数时间密码校验：先做等长摘要再比较，不泄露长度信息 */
export async function verifyPassword(candidate: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256Hex(candidate), sha256Hex(expected)]);
  return constantTimeEqual(a, b);
}

/** 签发会话 token：`<过期时间戳>.<随机数>.<HMAC 签名>` */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const random = hexEncode(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${expiresAt}.${random}`;
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

/** 校验 token：格式拆解 → 签名比对 → 过期检查 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expiresAt, random, signature] = parts;
  const expected = await hmac(`${expiresAt}.${random}`);
  if (!constantTimeEqual(signature, expected)) return false;
  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

/** 便捷方法：从请求 cookie 判断是否为有效管理员会话 */
export async function hasValidSession(request: NextRequest): Promise<boolean> {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * 内存级登录限流：5 次/分钟/IP（serverless 下按实例计，仅作基础防护；
 * 生产可再叠加 Vercel WAF）。命中限制后返回剩余等待秒数。
 */
const attempts = new Map<string, number[]>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    attempts.set(ip, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  attempts.set(ip, recent);
  // 顺手清理过期条目，避免 Map 无限增长
  if (attempts.size > 1000) {
    for (const [key, times] of attempts) {
      if (times.every(t => now - t >= WINDOW_MS)) attempts.delete(key);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** 获取客户端 IP（Vercel / 代理场景） */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
