import { getWelcomeEmailTemplate, isValidEmail } from '../services/email-templates';

export default {
  async subscribe(ctx: any) {
    try {
      const { email, name } = ctx.request.body;

      // 验证邮箱
      if (!email || !isValidEmail(email)) {
        return ctx.badRequest('Invalid email address');
      }

      // 检查是否已订阅
      const existing = await strapi.db.query('api::subscriber.subscriber').findOne({
        where: { email: email.toLowerCase() },
      });

      let subscriber;

      if (existing) {
        if (existing.status === 'active') {
          return ctx.send({ 
            message: 'Email already subscribed',
            alreadySubscribed: true 
          });
        } else {
          // 重新激活订阅
          subscriber = await strapi.db.query('api::subscriber.subscriber').update({
            where: { id: existing.id },
            data: { 
              status: 'active', 
              subscribedAt: new Date(),
              name: name || existing.name,
            },
          });
        }
      } else {
        // 创建新订阅者
        subscriber = await strapi.db.query('api::subscriber.subscriber').create({
          data: {
            email: email.toLowerCase(),
            name: name || '',
            status: 'active',
            subscribedAt: new Date(),
            source: 'website',
          },
        });
      }

      // 发送欢迎邮件
      try {
        await strapi.plugins['email'].services.email.send({
          to: email,
          from: 'future/proof <noreply@lizizai.xyz>',
          subject: 'Welcome to future/proof! 🎉',
          html: getWelcomeEmailTemplate(name),
        });
        
        strapi.log.info(`Welcome email sent to ${email}`);
      } catch (emailError) {
        strapi.log.error('Failed to send welcome email:', emailError);
        // 不阻止订阅成功，只记录错误
      }

      return ctx.send({ 
        message: 'Successfully subscribed! Check your email for a welcome message.',
        subscriber: {
          email: subscriber.email,
          name: subscriber.name,
        }
      });
    } catch (error) {
      strapi.log.error('Subscribe error:', error);
      return ctx.internalServerError('Subscription failed. Please try again later.');
    }
  },

  async unsubscribe(ctx: any) {
    try {
      const { email } = ctx.request.body;

      if (!email || !isValidEmail(email)) {
        return ctx.badRequest('Invalid email address');
      }

      const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
        where: { email: email.toLowerCase() },
      });

      if (!subscriber) {
        return ctx.notFound('Email not found in subscriber list');
      }

      if (subscriber.status === 'unsubscribed') {
        return ctx.send({ message: 'Email already unsubscribed' });
      }

      await strapi.db.query('api::subscriber.subscriber').update({
        where: { id: subscriber.id },
        data: {
          status: 'unsubscribed',
          unsubscribedAt: new Date(),
        },
      });

      return ctx.send({ message: 'Successfully unsubscribed' });
    } catch (error) {
      strapi.log.error('Unsubscribe error:', error);
      return ctx.internalServerError('Unsubscribe failed. Please try again later.');
    }
  },

  async count(ctx: any) {
    try {
      const count = await strapi.db.query('api::subscriber.subscriber').count({
        where: { status: 'active' },
      });

      return ctx.send({ count });
    } catch (error) {
      strapi.log.error('Count error:', error);
      return ctx.internalServerError('Failed to get subscriber count');
    }
  },
};
