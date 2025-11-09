import crypto from 'crypto';

// 常量定义
const TOKEN_EXPIRATION_HOURS = 24;

/**
 * 订阅者服务层
 *
 * 职责:
 * - 封装所有数据库操作
 * - 提供单一职责的方法
 * - 处理订阅者生命周期管理
 */
export class SubscriberService {
  /**
   * 根据邮箱查找订阅者
   */
  async findByEmail(email: string) {
    return await strapi.db.query('api::subscriber.subscriber').findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * 生成确认 token
   */
  generateConfirmationToken() {
    return {
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000),
    };
  }

  /**
   * 创建新订阅者（待确认状态）
   */
  async createPendingSubscriber(email: string, name: string) {
    const { token, expiresAt } = this.generateConfirmationToken();

    return await strapi.db.query('api::subscriber.subscriber').create({
      data: {
        email: email.toLowerCase(),
        name: name || '',
        status: 'pending',
        confirmationToken: token,
        tokenExpiresAt: expiresAt,
        subscribedAt: new Date(),
        source: 'website',
      },
    });
  }

  /**
   * 更新订阅者 token（用于重新发送确认邮件）
   */
  async updateSubscriberToken(id: number, name?: string) {
    const { token, expiresAt } = this.generateConfirmationToken();

    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        confirmationToken: token,
        tokenExpiresAt: expiresAt,
        ...(name && { name }),
      },
    });
  }

  /**
   * 重新激活订阅者（之前取消订阅的用户）
   */
  async reactivateSubscriber(id: number, name: string) {
    const { token, expiresAt } = this.generateConfirmationToken();

    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        status: 'pending',
        confirmationToken: token,
        tokenExpiresAt: expiresAt,
        subscribedAt: new Date(),
        name: name || '',
      },
    });
  }

  /**
   * 回滚订阅者状态
   */
  async rollbackSubscriber(id: number, originalState: any) {
    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: originalState,
    });
  }

  /**
   * 删除订阅者
   */
  async deleteSubscriber(id: number) {
    return await strapi.db.query('api::subscriber.subscriber').delete({
      where: { id },
    });
  }

  /**
   * 确认订阅
   */
  async confirmSubscription(id: number) {
    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        status: 'active',
        confirmedAt: new Date(),
        confirmationToken: null,
        tokenExpiresAt: null,
      },
    });
  }

  /**
   * 取消订阅
   */
  async unsubscribe(id: number) {
    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      },
    });
  }

  /**
   * 根据 token 查找订阅者
   */
  async findByToken(token: string) {
    return await strapi.db.query('api::subscriber.subscriber').findOne({
      where: { confirmationToken: token },
    });
  }

  /**
   * 获取活跃订阅者数量
   */
  async getActiveCount() {
    return await strapi.db.query('api::subscriber.subscriber').count({
      where: { status: 'active' },
    });
  }

  /**
   * 检查 token 是否过期
   */
  isTokenExpired(tokenExpiresAt: Date | null): boolean {
    if (!tokenExpiresAt) {
      return true;
    }
    return new Date(tokenExpiresAt) < new Date();
  }
}

export default new SubscriberService();
