import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::newsletter.newsletter', ({ strapi }) => ({
  /**
   * 订阅 Newsletter
   */
  async subscribe(ctx) {
    try {
      const { email } = ctx.request.body;

      if (!email) {
        return ctx.badRequest('Email is required');
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ctx.badRequest('Invalid email format');
      }

      const result = await strapi
        .service('api::newsletter.newsletter')
        .subscribe(email);

      strapi.log.info('Newsletter subscribe result:', result);

      if (!result.success) {
        if (result.code === 'ALREADY_SUBSCRIBED') {
          return ctx.badRequest(result.message);
        }
        return ctx.internalServerError(result.message);
      }

      ctx.body = {
        data: {
          message: result.message,
          code: result.code,
        },
      };
    } catch (error) {
      strapi.log.error('Newsletter subscribe controller error:', error);
      ctx.internalServerError('An error occurred while subscribing');
    }
  },

  /**
   * 取消订阅
   */
  async unsubscribe(ctx) {
    try {
      const { email } = ctx.request.body;

      if (!email) {
        return ctx.badRequest('Email is required');
      }

      const result = await strapi
        .service('api::newsletter.newsletter')
        .unsubscribe(email);

      if (!result.success) {
        if (result.code === 'NOT_FOUND') {
          return ctx.notFound(result.message);
        }
        return ctx.internalServerError(result.message);
      }

      ctx.body = {
        data: {
          message: result.message,
          code: result.code,
        },
      };
    } catch (error) {
      strapi.log.error('Newsletter unsubscribe controller error:', error);
      ctx.internalServerError('An error occurred while unsubscribing');
    }
  },
}));
