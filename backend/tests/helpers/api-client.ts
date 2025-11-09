import request from 'supertest';

/**
 * API测试客户端
 * 提供统一的HTTP请求方法和响应处理
 */
export class ApiClient {
  private baseURL: string;

  constructor(baseURL = 'http://localhost:10000') {
    this.baseURL = baseURL;
  }

  /**
   * GET 请求
   */
  async get(path: string, query?: Record<string, any>) {
    const req = request(this.baseURL).get(path);

    if (query) {
      req.query(query);
    }

    return req;
  }

  /**
   * POST 请求
   */
  async post(path: string, body?: Record<string, any>) {
    return request(this.baseURL)
      .post(path)
      .send(body || {})
      .set('Content-Type', 'application/json');
  }

  /**
   * PUT 请求
   */
  async put(path: string, body?: Record<string, any>) {
    return request(this.baseURL)
      .put(path)
      .send(body || {})
      .set('Content-Type', 'application/json');
  }

  /**
   * DELETE 请求
   */
  async delete(path: string) {
    return request(this.baseURL).delete(path);
  }

  /**
   * 生成随机邮箱
   */
  generateRandomEmail(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `test_${timestamp}_${random}@test.com`;
  }

  /**
   * 生成随机字符串
   */
  generateRandomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 等待指定时间
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ApiClient();
