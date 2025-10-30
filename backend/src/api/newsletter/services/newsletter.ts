import { factories } from '@strapi/strapi';
import { Resend } from 'resend';

// 欢迎邮件模板
function getWelcomeEmailTemplate(email: string): string {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Letters Clone</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Letters Clone! 🎉</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
            Hi there! 👋
          </p>
          
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">
            Thank you for subscribing to our newsletter! You've just joined a community of curious minds who love staying informed about the latest insights, stories, and ideas.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">What to expect:</h2>
            <ul style="color: #6b7280; font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li>Weekly curated articles and insights</li>
              <li>Exclusive content not available on the website</li>
              <li>Early access to new features and updates</li>
              <li>Tips and tricks to get the most out of our platform</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            We're excited to have you on board! Our next newsletter will be in your inbox soon.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${frontendUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Visit Our Website
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 20px;">
            <p style="font-size: 14px; color: #9ca3af; text-align: center; margin: 0;">
              You're receiving this email because you subscribed to Letters Clone newsletter.
            </p>
            <p style="font-size: 14px; color: #9ca3af; text-align: center; margin: 10px 0 0 0;">
              <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> | 
              <a href="${frontendUrl}/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            © ${new Date().getFullYear()} Letters Clone. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;
}

// 发送欢迎邮件
async function sendWelcomeEmail(email: string, strapi: any): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    strapi.log.warn('RESEND_API_KEY not configured, skipping welcome email');
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Letters Clone <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Letters Clone Newsletter! 🎉',
      html: getWelcomeEmailTemplate(email),
    });

    if (error) {
      strapi.log.error('Failed to send welcome email:', error);
      throw error;
    }

    strapi.log.info(`Welcome email sent to ${email}`);
  } catch (error) {
    strapi.log.error('Error sending welcome email:', error);
    throw error;
  }
}

export default factories.createCoreService('api::newsletter.newsletter', ({ strapi }) => ({
  /**
   * 订阅 Newsletter
   */
  async subscribe(email: string) {
    try {
      // 检查邮箱是否已订阅
      const existing = await strapi.db.query('api::newsletter.newsletter').findOne({
        where: { email },
      });

      if (existing) {
        if (existing.status === 'active') {
          return {
            success: false,
            message: 'This email is already subscribed',
            code: 'ALREADY_SUBSCRIBED',
          };
        } else {
          // 重新激活订阅
          await strapi.db.query('api::newsletter.newsletter').update({
            where: { id: existing.id },
            data: { status: 'active' },
          });
          
          return {
            success: true,
            message: 'Subscription reactivated successfully',
            code: 'REACTIVATED',
          };
        }
      }

      // 创建新订阅
      const newsletter = await strapi.db.query('api::newsletter.newsletter').create({
        data: {
          email,
          status: 'active',
        },
      });

      // 发送欢迎邮件（不阻塞订阅流程）
      try {
        await sendWelcomeEmail(email, strapi);
      } catch (emailError) {
        strapi.log.error('Failed to send welcome email, but subscription was successful:', emailError);
        // 不抛出错误，订阅仍然成功
      }

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
        code: 'SUBSCRIBED',
        data: newsletter,
      };
    } catch (error) {
      strapi.log.error('Newsletter subscription error:', error);
      return {
        success: false,
        message: 'Failed to subscribe',
        code: 'ERROR',
        error: error.message,
      };
    }
  },

  /**
   * 取消订阅
   */
  async unsubscribe(email: string) {
    try {
      const newsletter = await strapi.db.query('api::newsletter.newsletter').findOne({
        where: { email },
      });

      if (!newsletter) {
        return {
          success: false,
          message: 'Email not found',
          code: 'NOT_FOUND',
        };
      }

      await strapi.db.query('api::newsletter.newsletter').update({
        where: { id: newsletter.id },
        data: { status: 'unsubscribed' },
      });

      return {
        success: true,
        message: 'Successfully unsubscribed',
        code: 'UNSUBSCRIBED',
      };
    } catch (error) {
      strapi.log.error('Newsletter unsubscribe error:', error);
      return {
        success: false,
        message: 'Failed to unsubscribe',
        code: 'ERROR',
        error: error.message,
      };
    }
  },
}));
