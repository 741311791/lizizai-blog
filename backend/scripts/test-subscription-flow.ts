/**
 * 订阅流程诊断工具
 *
 * 用途：诊断订阅确认流程中的环境变量和链接生成问题
 */

console.log('🔍 订阅流程诊断工具\n');
console.log('='.repeat(60));

// 检查环境变量
console.log('\n📋 环境变量检查:\n');
console.log(`NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || '未设置'}`);
console.log(`PORT: ${process.env.PORT || '未设置'}`);
console.log(`HOST: ${process.env.HOST || '未设置'}`);

// 生成测试确认链接
const token = 'test-token-123456';
const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/subscribe/confirm?token=${token}`;

console.log('\n🔗 生成的确认链接:\n');
console.log(confirmationUrl);

console.log('\n✅ 期望的本地链接:\n');
console.log(`http://localhost:3000/api/subscribe/confirm?token=${token}`);

if (confirmationUrl.includes('localhost')) {
  console.log('\n✅ 链接配置正确！使用本地域名。');
} else {
  console.log('\n❌ 链接配置错误！未使用本地域名。');
  console.log('   请检查后端 .env 文件中的 FRONTEND_URL 配置。');
  console.log('   应该设置为: FRONTEND_URL=http://localhost:3000');
}

console.log('\n' + '='.repeat(60));
