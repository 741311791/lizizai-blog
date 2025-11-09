/**
 * 前端 API 接口测试工具
 *
 * 用途: 测试前端调用后端 API 的集成
 * 运行: npx tsx test-frontend-api.ts
 */

const FRONTEND_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:10000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

class FrontendAPITester {
  private results: TestResult[] = [];

  /**
   * 生成随机邮箱
   */
  generateRandomEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  }

  /**
   * 生成随机字符串
   */
  generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 运行单个测试
   */
  async runTest(name: string, testFn: () => Promise<void>) {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: true, duration });
      console.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMessage, duration });
      console.log(`❌ ${name} (${duration}ms)`);
      console.log(`   Error: ${errorMessage}`);
    }
  }

  /**
   * 测试订阅功能（通过前端 API 路由）
   */
  async testSubscribe() {
    console.log('\n📧 测试订阅功能\n');

    await this.runTest('应该成功创建新订阅', async () => {
      const email = this.generateRandomEmail();
      const name = 'Test User';

      const response = await fetch(`${FRONTEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(`订阅失败: ${data.error?.message || response.statusText}`);
      }

      const data = await response.json();
      if (!data.message || !data.requiresConfirmation) {
        throw new Error('响应格式不正确');
      }
    });

    await this.runTest('应该拒绝无效的邮箱地址', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email', name: 'Test' }),
      });

      if (response.ok) {
        throw new Error('应该拒绝无效邮箱但返回成功');
      }

      const data = await response.json();
      if (!data.error) {
        throw new Error('错误响应缺少 error 字段');
      }
    });

    await this.runTest('应该拒绝缺少邮箱的请求', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User' }),
      });

      if (response.ok) {
        throw new Error('应该拒绝缺少邮箱但返回成功');
      }
    });

    await this.runTest('应该处理重复订阅', async () => {
      const email = this.generateRandomEmail();
      const name = 'Test User';

      // 第一次订阅
      await fetch(`${FRONTEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      // 第二次订阅
      const response = await fetch(`${FRONTEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error('重复订阅应该返回成功');
      }

      const data = await response.json();
      if (!data.message) {
        throw new Error('响应缺少 message 字段');
      }
    });
  }

  /**
   * 测试订阅确认功能
   */
  async testSubscribeConfirm() {
    console.log('\n✅ 测试订阅确认功能\n');

    await this.runTest('应该拒绝缺少 token 的请求', async () => {
      const response = await fetch(`${BACKEND_URL}/api/subscribers/confirm`, {
        method: 'GET',
      });

      if (response.ok) {
        throw new Error('应该拒绝缺少 token 但返回成功');
      }

      // 容许 400 或 404 (Strapi 在查询参数缺失时可能返回 404)
      if (response.status !== 400 && response.status !== 404) {
        throw new Error(`期望状态码 400 或 404,实际 ${response.status}`);
      }
    });

    await this.runTest('应该拒绝无效的 token', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/subscribers/confirm?token=invalid-token-12345`,
        { method: 'GET' }
      );

      if (response.ok) {
        throw new Error('应该拒绝无效 token 但返回成功');
      }

      if (response.status !== 404) {
        throw new Error(`期望状态码 404,实际 ${response.status}`);
      }
    });
  }

  /**
   * 测试订阅者统计功能
   */
  async testSubscriberCount() {
    console.log('\n📊 测试订阅者统计功能\n');

    await this.runTest('应该返回订阅者数量', async () => {
      const response = await fetch(`${BACKEND_URL}/api/subscribers/count`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.statusText}`);
      }

      const data = await response.json();
      if (typeof data.count !== 'number') {
        throw new Error('count 字段不是数字类型');
      }

      if (data.count < 0) {
        throw new Error('count 不应该是负数');
      }
    });
  }

  /**
   * 测试文章点赞功能
   */
  async testArticleLike() {
    console.log('\n❤️ 测试文章点赞功能\n');

    await this.runTest('应该拒绝无效的文章ID', async () => {
      const response = await fetch(`${BACKEND_URL}/api/articles/invalid-id/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: 'test-visitor-123' }),
      });

      if (response.ok) {
        throw new Error('应该拒绝无效文章ID但返回成功');
      }
    });

    await this.runTest('应该拒绝不存在的文章ID', async () => {
      const response = await fetch(`${BACKEND_URL}/api/articles/999999/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: 'test-visitor-123' }),
      });

      if (response.status !== 404) {
        throw new Error(`期望状态码 404,实际 ${response.status}`);
      }
    });

    await this.runTest('应该拒绝缺少 visitorId 的请求', async () => {
      const response = await fetch(`${BACKEND_URL}/api/articles/1/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        throw new Error('应该拒绝缺少 visitorId 但返回成功');
      }
    });
  }

  /**
   * 测试健康检查
   */
  async testHealthCheck() {
    console.log('\n🏥 测试健康检查\n');

    await this.runTest('应该返回健康状态 (如果路由已配置)', async () => {
      const response = await fetch(`${BACKEND_URL}/api/health/_health`, {
        method: 'GET',
      });

      // 容许 200 或 404 (路由可能未配置)
      if (response.status !== 200 && response.status !== 404) {
        throw new Error(`意外的状态码: ${response.status}`);
      }

      if (response.status === 200) {
        const data = await response.json();
        if (!data.status) {
          throw new Error('响应缺少 status 字段');
        }
      }
    });

    await this.runTest('健康检查应该快速响应 (< 5秒)', async () => {
      const startTime = Date.now();
      const response = await fetch(`${BACKEND_URL}/api/health/_health`, {
        method: 'GET',
      });

      const duration = Date.now() - startTime;
      if (duration > 5000) {
        throw new Error(`响应时间 ${duration}ms 超过 5000ms`);
      }

      // 容许 200 或 404
      if (response.status !== 200 && response.status !== 404) {
        throw new Error(`意外的状态码: ${response.status}`);
      }
    });
  }

  /**
   * 打印测试总结
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('测试总结');
    console.log('='.repeat(60));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log(`\n总计: ${total} 个测试`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);

    if (failed > 0) {
      console.log('\n失败的测试:');
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 所有测试通过!');
    } else {
      console.log('⚠️ 部分测试失败,请检查上述错误。');
    }
  }

  /**
   * 运行所有测试
   */
  async runAll() {
    console.log('🚀 开始前端 API 集成测试...');
    console.log(`前端 URL: ${FRONTEND_URL}`);
    console.log(`后端 URL: ${BACKEND_URL}`);

    try {
      await this.testHealthCheck();
      await this.testSubscriberCount();
      await this.testSubscribe();
      await this.testSubscribeConfirm();
      await this.testArticleLike();
    } catch (error) {
      console.error('测试执行出错:', error);
    }

    this.printSummary();
  }
}

// 运行测试
const tester = new FrontendAPITester();
tester.runAll().catch(console.error);
