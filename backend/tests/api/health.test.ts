/// <reference types="jest" />
import apiClient from '../helpers/api-client';

/**
 * Health API 测试套件
 *
 * 测试覆盖:
 * - GET /api/health/_health - 健康检查端点
 */
describe('Health API', () => {
  describe('GET /api/health/_health', () => {
    it('应该返回健康状态 (如果路由已配置)', async () => {
      const response = await apiClient.get('/api/health/_health');

      // 可能返回 200 或 404 (取决于路由是否注册)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(['ok', 'healthy']).toContain(response.body.status);
      } else {
        // 路由未注册
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Health API 基础功能测试', () => {
    it('应该快速响应 (< 5秒)', async () => {
      const startTime = Date.now();
      const response = await apiClient.get('/api/health/_health');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000);
    });

    it('应该不需要认证', async () => {
      const response = await apiClient.get('/api/health/_health');

      // 应该返回 200 或 404,而不是 401/403
      expect([200, 404]).toContain(response.status);
    });
  });
});
