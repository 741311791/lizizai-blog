export function getWelcomeEmailTemplate(name: string): string {
  const displayName = name || 'there';
  
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
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 48px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header p {
      margin: 12px 0 0;
      font-size: 18px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 32px;
    }
    .content p {
      margin: 0 0 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .benefits {
      margin: 32px 0;
      padding: 0;
      list-style: none;
    }
    .benefits li {
      padding: 12px 0;
      font-size: 16px;
      line-height: 1.6;
    }
    .benefits li::before {
      content: "✓";
      display: inline-block;
      width: 24px;
      height: 24px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      margin-right: 12px;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      margin: 24px 0;
      font-weight: 600;
      font-size: 16px;
      transition: background 0.3s;
    }
    .button:hover {
      background: #5568d3;
    }
    .footer {
      background: #f9fafb;
      padding: 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 32px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to future/proof!</h1>
      <p>You're now part of something special</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${displayName}</strong>,</p>
      
      <p>Thank you for subscribing to <strong>future/proof</strong>! You've just joined <strong>178,000+ entrepreneurs</strong> who are building their future, one insight at a time.</p>
      
      <p>We're thrilled to have you in our community! 🚀</p>
      
      <div class="divider"></div>
      
      <p><strong>Here's what you can expect from us:</strong></p>
      
      <ul class="benefits">
        <li><strong>Weekly Insights:</strong> Get exclusive articles on AI, productivity, and personal growth delivered to your inbox every week</li>
        <li><strong>Early Access:</strong> Be the first to read new content and get special announcements before anyone else</li>
        <li><strong>Free Resources:</strong> Access templates, guides, and tools to help you build your one-person business</li>
        <li><strong>Community Access:</strong> Join discussions with like-minded entrepreneurs from around the world</li>
      </ul>
      
      <div class="divider"></div>
      
      <p>Your first newsletter will arrive in your inbox soon. In the meantime, feel free to explore our latest articles and resources.</p>
      
      <center>
        <a href="https://lizizai.xyz" class="button">Visit Our Website</a>
      </center>
      
      <p>Stay curious and keep building,<br>
      <strong>The future/proof Team</strong></p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you subscribed at <a href="https://lizizai.xyz">lizizai.xyz</a></p>
      <p style="margin-top: 16px;">
        <a href="https://lizizai.xyz">Visit Website</a> · 
        <a href="https://lizizai.xyz/privacy">Privacy Policy</a> · 
        <a href="https://lizizai.xyz/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">
        © 2025 future/proof. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate confirmation email template
 */
export function getConfirmationEmailTemplate(name: string, confirmationUrl: string): string {
  const displayName = name || 'there';
  
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
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 48px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .content p {
      margin: 0 0 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      margin: 24px 0;
      font-weight: 600;
      font-size: 18px;
      transition: background 0.3s;
    }
    .button:hover {
      background: #5568d3;
    }
    .footer {
      background: #f9fafb;
      padding: 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .link-text {
      color: #667eea;
      word-break: break-all;
      font-size: 14px;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 32px 0;
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
      
      <p>Thank you for subscribing to <strong>future/proof</strong>! To complete your subscription and start receiving our newsletter, please confirm your email address by clicking the button below:</p>
      
      <center>
        <a href="${confirmationUrl}" class="button">Confirm Subscription</a>
      </center>
      
      <div class="divider"></div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="link-text">${confirmationUrl}</p>
      
      <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">This link will expire in 24 hours. If you didn't subscribe to our newsletter, you can safely ignore this email.</p>
    </div>
    
    <div class="footer">
      <p><strong>future/proof</strong></p>
      <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
