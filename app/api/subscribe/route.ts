import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { config } from '@/lib/env';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getWelcomeEmailHTML(name: string): string {
  const displayName = name || 'there';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 48px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
    .header p { margin: 12px 0 0; font-size: 18px; opacity: 0.95; }
    .content { padding: 40px 32px; }
    .content p { margin: 0 0 16px; font-size: 16px; }
    .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 600; font-size: 16px; }
    .footer { background: #f9fafb; padding: 32px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Zizai Blog!</h1>
      <p>You're now part of something special</p>
    </div>
    <div class="content">
      <p>Hi <strong>${displayName}</strong>,</p>
      <p>Thank you for subscribing to <strong>Zizai Blog</strong>! You've just joined a community of builders, creators, and lifelong learners.</p>
      <p>Here's what you can expect:</p>
      <ul>
        <li>Weekly insights on AI, productivity, and personal growth</li>
        <li>Early access to new content and announcements</li>
        <li>Free resources and tools for your journey</li>
      </ul>
      <center>
        <a href="${config.siteUrl}" class="button">Visit Our Website</a>
      </center>
      <p>Stay curious and keep building,<br><strong>The Zizai Blog Team</strong></p>
    </div>
    <div class="footer">
      <p>You're receiving this because you subscribed at <a href="${config.siteUrl}">${config.siteUrl}</a></p>
    </div>
  </div>
</body>
</html>`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: { message: 'Invalid email address' } },
        { status: 400 }
      );
    }

    // 如果没有配置 Resend API Key，仅记录订阅
    if (!resend) {
      console.log(`[Subscribe] New subscriber: ${email} (${name || 'no name'}) - RESEND_API_KEY not configured`);
      return NextResponse.json({
        message: 'Subscription recorded (email service not configured).',
        subscriber: { email, name },
      });
    }

    // 发送欢迎邮件
    const { error } = await resend.emails.send({
      from: config.resendFromEmail,
      to: email,
      subject: 'Welcome to Zizai Blog!',
      html: getWelcomeEmailHTML(name),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: { message: 'Failed to send welcome email.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Welcome email sent! Check your inbox.',
      subscriber: { email, name },
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: { message: 'Subscription failed. Please try again later.' } },
      { status: 500 }
    );
  }
}
