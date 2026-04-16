/**
 * 邮件模板生成器
 *
 * 提供可配置的邮件 HTML 模板
 */

/**
 * 生成欢迎邮件 HTML
 */
export function getWelcomeEmailHTML(name: string): string {
  const displayName = name || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lizizai.xyz';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px;
      font-size: 16px;
      color: #4a5568;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 10px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #718096;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Zizai Blog!</h1>
      <p>You're now part of something special</p>
    </div>

    <div class="content">
      <p>Hi <strong>${displayName}</strong>,</p>

      <p>Thank you for subscribing to <strong>Zizai Blog</strong>! We're thrilled to have you join our community of forward-thinking individuals.</p>

      <p>You'll receive our latest insights, stories, and updates directly in your inbox. Get ready for content that challenges the status quo and inspires innovation.</p>

      <center>
        <a href="${siteUrl}" class="button">Visit Our Website</a>
      </center>

      <p>Stay curious and keep building,<br>
      <strong>The Zizai Blog Team</strong></p>
    </div>

    <div class="footer">
      <p>You're receiving this email because you subscribed at <a href="${siteUrl}">${siteUrl}</a></p>
      <p style="margin-top: 16px;">
        <a href="${siteUrl}">Visit Website</a> ·
        <a href="${siteUrl}/privacy">Privacy Policy</a> ·
        <a href="${siteUrl}/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Zizai Blog. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 生成确认邮件 HTML
 */
export function getConfirmationEmailHTML(name: string, confirmationUrl: string): string {
  const displayName = name || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lizizai.xyz';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px;
      font-size: 16px;
      color: #4a5568;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 10px 0;
    }
    .link {
      word-break: break-all;
      color: #667eea;
      font-size: 14px;
      background-color: #f7fafc;
      padding: 12px;
      border-radius: 4px;
      display: block;
      margin: 10px 0;
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #718096;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Confirm Your Subscription</h1>
    </div>

    <div class="content">
      <p>Hi <strong>${displayName}</strong>,</p>

      <p>Thank you for subscribing to Zizai Blog! Please confirm your email address by clicking the button below:</p>

      <center>
        <a href="${confirmationUrl}" class="button">Confirm Subscription</a>
      </center>

      <p>Or copy and paste this link into your browser:</p>
      <div class="link">${confirmationUrl}</div>

      <p style="font-size: 14px; color: #718096;"><em>This link will expire in 24 hours.</em></p>
    </div>

    <div class="footer">
      <p>If you didn't request this, please ignore this email.</p>
      <p><a href="${siteUrl}">Visit Website</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
