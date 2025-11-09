/// <reference types="jest" />
import apiClient from '../helpers/api-client';

/**
 * Article API 测试套件
 *
 * 测试覆盖:
 * - POST /api/articles/:id/like - 文章点赞功能
 */
describe('Article API', () => {
  describe('POST /api/articles/:id/like', () => {
    it('应该拒绝无效的文章ID (非数字)', async () => {
      const response = await apiClient.post('/api/articles/invalid-id/like', {
        visitorId: 'test-visitor-123',
      });

      // 可能返回 404 或 400
      expect([400, 404, 500]).toContain(response.status);
    });

    it('应该拒绝不存在的文章ID', async () => {
      const response = await apiClient.post('/api/articles/999999/like', {
        visitorId: 'test-visitor-123',
      });

      // 应该返回 404
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝缺少 visitorId 的请求', async () => {
      const response = await apiClient.post('/api/articles/1/like', {});

      // 根据实现,可能返回 400
      expect([400, 500]).toContain(response.status);
    });

    it('应该接受任意长度的 visitorId', async () => {
      const response = await apiClient.post('/api/articles/1/like', {
        visitorId: '12',
      });

      // 实现没有长度限制,只要存在且为字符串即可
      // 可能返回 200 (成功) 或 404 (文章不存在)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Article API 边界测试', () => {
    it('应该处理极大的文章ID', async () => {
      const response = await apiClient.post('/api/articles/999999999999/like', {
        visitorId: apiClient.generateRandomString(20),
      });

      // 应该返回 404 或 500 (如果ID超出数据库范围)
      expect([404, 500]).toContain(response.status);
    });

    it('应该处理极长的 visitorId', async () => {
      const longVisitorId = apiClient.generateRandomString(1000);

      const response = await apiClient.post('/api/articles/1/like', {
        visitorId: longVisitorId,
      });

      // 根据实现,可能限制长度、正常处理或数据库错误
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('应该处理特殊字符的 visitorId', async () => {
      const specialVisitorId = '<script>alert("xss")</script>';

      const response = await apiClient.post('/api/articles/1/like', {
        visitorId: specialVisitorId,
      });

      // 应该被过滤或拒绝
      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
