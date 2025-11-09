/**
 * 确认订阅 API 路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmSubscription, BackendAPIError } from '@/lib/backend-api';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/subscribe?error=missing_token', request.url)
      );
    }

    await confirmSubscription(token);

    // Success - redirect to success page
    return NextResponse.redirect(
      new URL('/subscribe?confirmed=true', request.url)
    );
  } catch (error) {
    if (error instanceof BackendAPIError) {
      const errorParam = encodeURIComponent(error.message);
      return NextResponse.redirect(
        new URL(`/subscribe?error=${errorParam}`, request.url)
      );
    }

    console.error('Confirmation error:', error);
    return NextResponse.redirect(
      new URL('/subscribe?error=confirmation_failed', request.url)
    );
  }
}
