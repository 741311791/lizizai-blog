import { isValidEmail } from '../services/email-templates';
import subscriberService from '../services/subscriber-service';
import emailService from '../services/email-service';
import logger from '../../../utils/logger';

/**
 * 订阅控制器（重构版）
 *
 * 重构原则:
 * - KISS: 简化逻辑,每个方法职责单一
 * - DRY: 提取重复逻辑到服务层
 * - 单一职责: 控制器仅处理 HTTP 请求响应
 */
export default {
  /**
   * 订阅处理（简化版）
   */
  async subscribe(ctx: any) {
    try {
      const { email, name } = ctx.request.body;

      // 1. 验证输入
      if (!email || !isValidEmail(email)) {
        return ctx.badRequest('Invalid email address');
      }

      // 2. 检查现有订阅
      const existing = await subscriberService.findByEmail(email);

      // 3. 处理不同状态
      const result = await this.handleSubscriberState(existing, email, name);

      if (result.alreadySubscribed) {
        return ctx.send({
          message: 'Email already subscribed',
          alreadySubscribed: true,
        });
      }

      // 4. 发送确认邮件
      try {
        await emailService.sendConfirmation(
          result.subscriber.email,
          result.subscriber.name,
          result.subscriber.confirmationToken
        );
      } catch (emailError) {
        // 回滚数据变更
        await this.rollbackSubscription(result, existing);
        return ctx.internalServerError('Failed to send confirmation email. Please try again later.');
      }

      // 5. 返回成功响应
      return ctx.send({
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
        subscriber: {
          email: result.subscriber.email,
          name: result.subscriber.name,
        },
      });
    } catch (error) {
      logger.error('Subscribe error:', error);
      return ctx.internalServerError('Subscription failed. Please try again later.');
    }
  },

  /**
   * 处理订阅者状态（状态机模式）
   */
  async handleSubscriberState(existing: any, email: string, name: string) {
    if (!existing) {
      // 新订阅者
      const subscriber = await subscriberService.createPendingSubscriber(email, name);
      return { subscriber, isNew: true };
    }

    if (existing.status === 'active') {
      // 已激活
      return { alreadySubscribed: true };
    }

    if (existing.status === 'pending') {
      // 重新发送确认
      const subscriber = await subscriberService.updateSubscriberToken(
        existing.id,
        name || existing.name
      );
      return {
        subscriber,
        isNew: false,
        originalState: {
          confirmationToken: existing.confirmationToken,
          tokenExpiresAt: existing.tokenExpiresAt,
          name: existing.name,
        },
      };
    }

    // 重新激活（之前取消订阅）
    const subscriber = await subscriberService.reactivateSubscriber(existing.id, name);
    return {
      subscriber,
      isNew: false,
      originalState: {
        status: existing.status,
        confirmationToken: existing.confirmationToken,
        tokenExpiresAt: existing.tokenExpiresAt,
        subscribedAt: existing.subscribedAt,
        name: existing.name,
      },
    };
  },

  /**
   * 回滚订阅操作
   */
  async rollbackSubscription(result: any, existing: any) {
    if (result.isNew) {
      await subscriberService.deleteSubscriber(result.subscriber.id);
      logger.info(`Rolled back: deleted new subscriber ${result.subscriber.email}`);
    } else if (result.originalState) {
      await subscriberService.rollbackSubscriber(result.subscriber.id, result.originalState);
      logger.info(`Rolled back: restored previous data for ${result.subscriber.email}`);
    }
  },

  /**
   * 取消订阅
   */
  async unsubscribe(ctx: any) {
    try {
      const { email } = ctx.request.body;

      if (!email || !isValidEmail(email)) {
        return ctx.badRequest('Invalid email address');
      }

      const subscriber = await subscriberService.findByEmail(email);

      if (!subscriber) {
        return ctx.notFound('Email not found in subscriber list');
      }

      if (subscriber.status === 'unsubscribed') {
        return ctx.send({ message: 'Email already unsubscribed' });
      }

      await subscriberService.unsubscribe(subscriber.id);

      return ctx.send({ message: 'Successfully unsubscribed' });
    } catch (error) {
      logger.error('Unsubscribe error:', error);
      return ctx.internalServerError('Unsubscribe failed. Please try again later.');
    }
  },

  /**
   * 获取订阅者数量
   */
  async count(ctx: any) {
    try {
      const count = await subscriberService.getActiveCount();
      return ctx.send({ count });
    } catch (error) {
      logger.error('Count error:', error);
      return ctx.internalServerError('Failed to get subscriber count');
    }
  },

  /**
   * 确认订阅
   */
  async confirm(ctx: any) {
    try {
      const { token } = ctx.query;

      if (!token) {
        return ctx.badRequest('Confirmation token is required');
      }

      // 查找订阅者
      logger.dev(`Processing confirmation request`);

      const subscriber = await subscriberService.findByToken(token);

      if (!subscriber) {
        logger.warn(`Invalid confirmation token attempt from IP: ${ctx.ip}`);
        return ctx.notFound('Invalid confirmation token');
      }

      // 检查 token 是否过期
      if (subscriberService.isTokenExpired(subscriber.tokenExpiresAt)) {
        return ctx.badRequest('Confirmation token has expired. Please subscribe again.');
      }

      // 检查是否已经确认
      if (subscriber.status === 'active' && subscriber.confirmedAt) {
        return ctx.send({
          message: 'Email already confirmed',
          alreadyConfirmed: true,
        });
      }

      // 确认订阅
      await subscriberService.confirmSubscription(subscriber.id);

      // 发送欢迎邮件（不阻塞响应）
      emailService.sendWelcome(subscriber.email, subscriber.name || '');

      logger.info(`Subscription confirmed for ${subscriber.email}`);

      return ctx.send({
        message: 'Subscription confirmed successfully! Welcome to Zizai Blog.',
        success: true,
      });
    } catch (error) {
      logger.error('Confirm subscription error:', error);
      return ctx.internalServerError('Confirmation failed. Please try again later.');
    }
  },
};
