import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/subscribe?error=missing_token', request.url)
      );
    }

    // Call backend confirm endpoint
    const response = await fetch(
      `${STRAPI_URL}/api/subscribers/confirm?token=${token}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle different error cases
      if (response.status === 404) {
        return NextResponse.redirect(
          new URL('/subscribe?error=invalid_token', request.url)
        );
      }
      if (response.status === 400 && data.error?.message?.includes('expired')) {
        return NextResponse.redirect(
          new URL('/subscribe?error=token_expired', request.url)
        );
      }
      return NextResponse.redirect(
        new URL('/subscribe?error=confirmation_failed', request.url)
      );
    }

    // Success - redirect to success page
    return NextResponse.redirect(
      new URL('/subscribe?confirmed=true', request.url)
    );
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.redirect(
      new URL('/subscribe?error=server_error', request.url)
    );
  }
}
