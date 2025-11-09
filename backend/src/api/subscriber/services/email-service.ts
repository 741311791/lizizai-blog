import { sendConfirmationEmail, sendWelcomeEmail } from './resend-service';
import logger from '../../../utils/logger';

/**
 * 邮件服务层
 *
 * 职责:
 * - 封装邮件发送逻辑
 * - 统一错误处理
 * - 构建邮件 URL
 */
export class EmailService {
  /**
   * 发送确认邮件（带错误处理）
   */
  async sendConfirmation(email: string, name: string, token: string): Promise<void> {
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/subscribe/confirm?token=${token}`;

    try {
      logger.info(`Sending confirmation email to ${email}`);
      logger.sensitive(`Confirmation URL:`, confirmationUrl);

      await sendConfirmationEmail(email, name, confirmationUrl);

      logger.info(`Confirmation email sent successfully to ${email}`);
    } catch (error) {
      logger.error('Failed to send confirmation email:', error);
      throw error;
    }
  }

  /**
   * 发送欢迎邮件（不抛出错误，仅记录）
   */
  async sendWelcome(email: string, name: string): Promise<void> {
    try {
      logger.info(`Sending welcome email to ${email}`);

      await sendWelcomeEmail(email, name);

      logger.info(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      // 不抛出错误,不影响主流程
    }
  }
}

export default new EmailService();
