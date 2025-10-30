import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::newsletter.newsletter', ({ strapi }) => ({
  /**
   * 订阅 Newsletter
   */
  async subscribe(email: string) {
    try {
      strapi.log.info(`Newsletter subscribe called with email: ${email}`);

      // 检查邮箱是否已订阅
      const existing = await strapi.db.query('api::newsletter.newsletter').findOne({
        where: { email },
      });

      strapi.log.info(`Existing subscription check result:`, existing);

      if (existing) {
        if (existing.status === 'active') {
          strapi.log.info(`Email already subscribed: ${email}`);
          return {
            success: false,
            message: 'This email is already subscribed',
            code: 'ALREADY_SUBSCRIBED',
          };
        } else {
          // 重新激活订阅
          strapi.log.info(`Reactivating subscription for: ${email}`);
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
      strapi.log.info(`Creating new subscription for: ${email}`);
      const newsletter = await strapi.db.query('api::newsletter.newsletter').create({
        data: {
          email,
          status: 'active',
        },
      });

      strapi.log.info(`Newsletter created successfully:`, newsletter);

      // TODO: 发送欢迎邮件（暂时禁用以便调试）
      // 等功能稳定后再启用邮件发送
      strapi.log.info(`Skipping welcome email for now`);

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
        code: 'SUBSCRIBED',
        data: newsletter,
      };
    } catch (error) {
      strapi.log.error('Newsletter subscription error:', error);
      strapi.log.error('Error stack:', error.stack);
      return {
        success: false,
        message: error.message || 'Failed to subscribe',
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
