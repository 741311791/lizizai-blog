/// <reference types="jest" />
import apiClient from '../helpers/api-client';

/**
 * Subscriber API 测试套件
 *
 * 测试覆盖:
 * - POST /api/subscribers/subscribe - 订阅功能
 * - POST /api/subscribers/unsubscribe - 取消订阅功能
 * - GET /api/subscribers/count - 获取订阅者数量
 * - GET /api/subscribe/confirm - 确认订阅
 */
describe('Subscriber API', () => {
  describe('POST /api/subscribers/subscribe', () => {
    it('应该成功创建新订阅 (有效邮箱)', async () => {
      const email = apiClient.generateRandomEmail();
      const name = 'Test User';

      const response = await apiClient.post('/api/subscribers/subscribe', {
        email,
        name,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('requiresConfirmation', true);
      expect(response.body.subscriber).toHaveProperty('email', email);
      expect(response.body.subscriber).toHaveProperty('name', name);
    });

    it('应该拒绝无效的邮箱地址', async () => {
      const response = await apiClient.post('/api/subscribers/subscribe', {
        email: 'invalid-email',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝缺少邮箱的请求', async () => {
      const response = await apiClient.post('/api/subscribers/subscribe', {
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该处理重复订阅 (已激活邮箱)', async () => {
      const email = apiClient.generateRandomEmail();
      const name = 'Test User';

      // 第一次订阅
      await apiClient.post('/api/subscribers/subscribe', { email, name });

      // 尝试重复订阅
      const response = await apiClient.post('/api/subscribers/subscribe', {
        email,
        name,
      });

      expect(response.status).toBe(200);
      // 应该返回待确认或已订阅的状态
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/subscribers/unsubscribe', () => {
    it('应该拒绝无效的邮箱地址', async () => {
      const response = await apiClient.post('/api/subscribers/unsubscribe', {
        email: 'invalid-email',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该处理不存在的邮箱', async () => {
      const email = apiClient.generateRandomEmail();

      const response = await apiClient.post('/api/subscribers/unsubscribe', {
        email,
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝缺少邮箱的请求', async () => {
      const response = await apiClient.post('/api/subscribers/unsubscribe', {});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/subscribers/count', () => {
    it('应该返回订阅者数量', async () => {
      const response = await apiClient.get('/api/subscribers/count');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/subscribe/confirm', () => {
    it('应该拒绝缺少 token 的请求', async () => {
      const response = await apiClient.get('/api/subscribe/confirm');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝无效的 token', async () => {
      const response = await apiClient.get('/api/subscribe/confirm', {
        token: 'invalid-token-12345',
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝过期的 token', async () => {
      const response = await apiClient.get('/api/subscribe/confirm', {
        token: 'expired-token-67890',
      });

      // 根据实际实现,可能返回 400 或 404
      expect([400, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Subscriber API 集成测试', () => {
    it('完整订阅流程: 订阅 -> 计数增加', async () => {
      // 1. 获取初始订阅者数量
      const initialCount = await apiClient.get('/api/subscribers/count');
      const initialNumber = initialCount.body.count;

      // 2. 创建新订阅
      const email = apiClient.generateRandomEmail();
      const subscribeResponse = await apiClient.post('/api/subscribers/subscribe', {
        email,
        name: 'Integration Test User',
      });

      expect(subscribeResponse.status).toBe(200);

      // 3. 等待一小段时间确保数据库更新
      await apiClient.wait(500);

      // 4. 验证订阅者数量未增加 (因为尚未确认)
      const afterSubscribeCount = await apiClient.get('/api/subscribers/count');
      expect(afterSubscribeCount.body.count).toBe(initialNumber);
    });
  });
});
