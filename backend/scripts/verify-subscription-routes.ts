#!/usr/bin/env tsx
/**
 * 订阅路由验证脚本
 *
 * 用途：验证所有订阅相关的路由是否正确配置
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 验证订阅相关路由配置...\n');

// 检查后端路由配置
const routesPath = path.join(__dirname, '../src/api/subscriber/routes/subscriber.ts');

if (!fs.existsSync(routesPath)) {
  console.error('❌ 路由文件不存在:', routesPath);
  process.exit(1);
}

const routesContent = fs.readFileSync(routesPath, 'utf-8');

console.log('📋 后端路由检查:');
console.log('================\n');

// 定义预期的路由
const expectedRoutes = [
  { path: '/subscribers/subscribe', method: 'POST', description: '订阅' },
  { path: '/subscribers/unsubscribe', method: 'POST', description: '取消订阅' },
  { path: '/subscribers/count', method: 'GET', description: '订阅统计' },
  { path: '/subscribe/confirm', method: 'GET', description: '确认订阅' },
];

let allRoutesOk = true;

for (const route of expectedRoutes) {
  const pathRegex = new RegExp(`path:\\s*['"]${route.path.replace('/', '\\/')}['"]`, 'i');
  const methodRegex = new RegExp(`method:\\s*['"]${route.method}['"]`, 'i');

  const hasPath = pathRegex.test(routesContent);
  const hasMethod = methodRegex.test(routesContent);

  if (hasPath && hasMethod) {
    console.log(`✅ ${route.method.padEnd(6)} /api${route.path.padEnd(30)} - ${route.description}`);
  } else {
    console.log(`❌ ${route.method.padEnd(6)} /api${route.path.padEnd(30)} - ${route.description} (未找到)`);
    allRoutesOk = false;
  }
}

console.log('\n📋 邮件服务URL生成检查:');
console.log('========================\n');

// 检查邮件服务
const emailServicePath = path.join(__dirname, '../src/api/subscriber/services/email-service.ts');

if (fs.existsSync(emailServicePath)) {
  const emailContent = fs.readFileSync(emailServicePath, 'utf-8');

  // 检查确认URL生成
  if (emailContent.includes('/api/subscribe/confirm')) {
    console.log('✅ 邮件服务生成的URL: /api/subscribe/confirm');
  } else if (emailContent.includes('/api/subscribers/confirm')) {
    console.log('⚠️  邮件服务生成的URL: /api/subscribers/confirm (可能不正确)');
    allRoutesOk = false;
  } else {
    console.log('❌ 无法检测到确认URL生成代码');
    allRoutesOk = false;
  }

  // 检查是否使用了 FRONTEND_URL 环境变量
  if (emailContent.includes('FRONTEND_URL')) {
    console.log('✅ 使用 FRONTEND_URL 环境变量');
  } else {
    console.log('⚠️  未使用 FRONTEND_URL 环境变量（可能硬编码了URL）');
  }
} else {
  console.log('⚠️  邮件服务文件不存在，跳过检查');
}

console.log('\n📋 前端API路由检查:');
console.log('==================\n');

// 检查前端路由
const frontendRoutePath = path.join(__dirname, '../../frontend/app/api/subscribe/confirm/route.ts');

if (fs.existsSync(frontendRoutePath)) {
  console.log('✅ 前端路由文件存在: app/api/subscribe/confirm/route.ts');

  const frontendContent = fs.readFileSync(frontendRoutePath, 'utf-8');

  // 检查调用的后端路径
  if (frontendContent.includes('/api/subscribe/confirm')) {
    console.log('✅ 前端调用路径: /api/subscribe/confirm (正确)');
  } else if (frontendContent.includes('/api/subscribers/confirm')) {
    console.log('❌ 前端调用路径: /api/subscribers/confirm (错误，应该是 /api/subscribe/confirm)');
    allRoutesOk = false;
  } else {
    console.log('⚠️  无法检测到前端调用的后端路径');
  }

  // 检查是否使用了 encodeURIComponent
  if (frontendContent.includes('encodeURIComponent(token)')) {
    console.log('✅ Token 已正确编码（encodeURIComponent）');
  } else {
    console.log('⚠️  Token 未编码，建议使用 encodeURIComponent');
  }
} else {
  console.log('❌ 前端路由文件不存在:', frontendRoutePath);
  allRoutesOk = false;
}

console.log('\n📋 环境变量检查:');
console.log('================\n');

// 检查环境变量文件
const envPath = path.join(__dirname, '../.env');
const envLocalPath = path.join(__dirname, '../.env.local');

let frontendUrl = '';

if (fs.existsSync(envLocalPath)) {
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');
  const match = envLocalContent.match(/FRONTEND_URL\s*=\s*(.+)/);
  if (match) {
    frontendUrl = match[1].trim();
    console.log(`✅ .env.local 中的 FRONTEND_URL: ${frontendUrl}`);
  }
}

if (!frontendUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/FRONTEND_URL\s*=\s*(.+)/);
  if (match) {
    frontendUrl = match[1].trim();
    console.log(`✅ .env 中的 FRONTEND_URL: ${frontendUrl}`);
  }
}

if (frontendUrl) {
  if (frontendUrl.includes('localhost:3000')) {
    console.log('✅ FRONTEND_URL 指向本地开发环境');
  } else if (frontendUrl.includes('lizizai.xyz')) {
    console.log('⚠️  FRONTEND_URL 指向生产环境，本地测试时请确认这是否正确');
  }
} else {
  console.log('⚠️  未找到 FRONTEND_URL 环境变量');
}

// 检查前端环境变量
const frontendEnvLocalPath = path.join(__dirname, '../../frontend/.env.local');

if (fs.existsSync(frontendEnvLocalPath)) {
  const frontendEnvContent = fs.readFileSync(frontendEnvLocalPath, 'utf-8');
  const match = frontendEnvContent.match(/NEXT_PUBLIC_STRAPI_URL\s*=\s*(.+)/);
  if (match) {
    const strapiUrl = match[1].trim();
    console.log(`✅ 前端 NEXT_PUBLIC_STRAPI_URL: ${strapiUrl}`);

    if (strapiUrl.includes('localhost:10000')) {
      console.log('✅ 前端配置指向本地后端');
    } else if (strapiUrl.includes('onrender.com')) {
      console.log('⚠️  前端配置指向生产后端，本地测试时请确认这是否正确');
    }
  }
} else {
  console.log('⚠️  前端 .env.local 文件不存在，可能使用 .env 中的配置');
}

console.log('\n' + '='.repeat(60));
console.log('📊 验证结果总结:');
console.log('='.repeat(60) + '\n');

if (allRoutesOk) {
  console.log('✅ 所有路由配置检查通过！\n');
  console.log('🎯 关键点确认:');
  console.log('  • 后端确认路由: GET /api/subscribe/confirm (单数 subscribe)');
  console.log('  • 前端调用路径: /api/subscribe/confirm (单数 subscribe)');
  console.log('  • 邮件生成URL: /api/subscribe/confirm (单数 subscribe)\n');
  console.log('✨ 订阅确认功能应该可以正常工作了！\n');
  console.log('🚀 下一步: 重启后端和前端服务，然后测试订阅确认流程');
  process.exit(0);
} else {
  console.log('❌ 发现配置问题，请检查上述标记为 ❌ 或 ⚠️ 的项目\n');
  console.log('💡 常见问题:');
  console.log('  1. 前端调用路径应该是 /api/subscribe/confirm（单数）');
  console.log('  2. 不是 /api/subscribers/confirm（复数）');
  console.log('  3. 确保 FRONTEND_URL 和 NEXT_PUBLIC_STRAPI_URL 配置正确\n');
  process.exit(1);
}
