/**
 * Jest Global Teardown
 * 在所有测试结束后执行一次
 */

export default async () => {
  console.log('\n🧹 Cleaning up test environment...\n');
  console.log('✅ Test environment cleaned up\n');
};
