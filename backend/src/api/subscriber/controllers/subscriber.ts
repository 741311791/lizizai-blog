import { isValidEmail } from '../services/email-templates';
import { sendConfirmationEmail, sendWelcomeEmail } from '../services/resend-service';
import crypto from 'crypto';

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
        } else if (existing.status === 'pending') {
          // 重新发送确认邮件
          const confirmationToken = crypto.randomBytes(32).toString('hex');
          const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          
          subscriber = await strapi.db.query('api::subscriber.subscriber').update({
            where: { id: existing.id },
            data: { 
              confirmationToken,
              tokenExpiresAt,
              name: name || existing.name,
            },
          });
        } else {
          // 重新订阅（之前取消订阅的用户）
          const confirmationToken = crypto.randomBytes(32).toString('hex');
          const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          subscriber = await strapi.db.query('api::subscriber.subscriber').update({
            where: { id: existing.id },
            data: { 
              status: 'pending',
              confirmationToken,
              tokenExpiresAt,
              subscribedAt: new Date(),
              name: name || existing.name,
            },
          });
        }
      } else {
        // 创建新订阅者（待确认状态）
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        subscriber = await strapi.db.query('api::subscriber.subscriber').create({
          data: {
            email: email.toLowerCase(),
            name: name || '',
            status: 'pending',
            confirmationToken,
            tokenExpiresAt,
            subscribedAt: new Date(),
            source: 'website',
          },
        });
      }

      // 发送确认邮件
      try {
        const confirmationUrl = `https://lizizai.xyz/api/subscribe/confirm?token=${subscriber.confirmationToken}`;
        
        strapi.log.info(`Generated token for ${email}: ${subscriber.confirmationToken}`);
        strapi.log.info(`Confirmation URL: ${confirmationUrl}`);
        
        await sendConfirmationEmail(email, name || '', confirmationUrl);
        
        strapi.log.info(`Confirmation email sent to ${email}`);
      } catch (emailError) {
        strapi.log.error('Failed to send confirmation email:', emailError);
        // 删除创建的订阅者记录
        if (!existing) {
          await strapi.db.query('api::subscriber.subscriber').delete({
            where: { id: subscriber.id },
          });
        }
        return ctx.internalServerError('Failed to send confirmation email. Please try again later.');
      }

      return ctx.send({ 
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
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

  async confirm(ctx: any) {
    try {
      const { token } = ctx.query;

      if (!token) {
        return ctx.badRequest('Confirmation token is required');
      }

      // 查找订阅者
      strapi.log.info(`Confirming subscription with token: ${token}`);
      
      const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
        where: { confirmationToken: token },
      });

      strapi.log.info(`Subscriber found: ${subscriber ? 'Yes' : 'No'}`);
      if (subscriber) {
        strapi.log.info(`Subscriber details: ${JSON.stringify({
          id: subscriber.id,
          email: subscriber.email,
          status: subscriber.status,
          hasToken: !!subscriber.confirmationToken,
          tokenMatch: subscriber.confirmationToken === token
        })}`);
      }

      if (!subscriber) {
        return ctx.notFound('Invalid confirmation token');
      }

      // 检查 token 是否过期
      if (subscriber.tokenExpiresAt && new Date(subscriber.tokenExpiresAt) < new Date()) {
        return ctx.badRequest('Confirmation token has expired. Please subscribe again.');
      }

      // 检查是否已经确认
      if (subscriber.status === 'active' && subscriber.confirmedAt) {
        return ctx.send({ 
          message: 'Email already confirmed',
          alreadyConfirmed: true 
        });
      }

      // 更新订阅者状态
      await strapi.db.query('api::subscriber.subscriber').update({
        where: { id: subscriber.id },
        data: {
          status: 'active',
          confirmedAt: new Date(),
          confirmationToken: null,
          tokenExpiresAt: null,
        },
      });

      // 发送欢迎邮件
      try {
        await sendWelcomeEmail(subscriber.email, subscriber.name || '');
        
        strapi.log.info(`Welcome email sent to ${subscriber.email}`);
      } catch (emailError) {
        strapi.log.error('Failed to send welcome email:', emailError);
        // 不阻止确认成功，只记录错误
      }

      return ctx.send({ 
        message: 'Subscription confirmed successfully! Welcome to future/proof.',
        success: true 
      });
    } catch (error) {
      strapi.log.error('Confirm subscription error:', error);
      return ctx.internalServerError('Confirmation failed. Please try again later.');
    }
  },
};
