/**
 * Jest Global Setup
 * 在所有测试开始前执行一次
 */

export default async () => {
  console.log('\n🧪 Initializing test environment...\n');

  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.PORT = '10000';

  console.log('✅ Test environment initialized\n');
};
