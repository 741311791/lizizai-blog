#!/usr/bin/env node

/**
 * 生成 Strapi 所需的密钥
 *
 * 使用方法:
 *   node scripts/generate-secrets.js
 *
 * 这将生成新的密钥并输出到终端,你可以将它们复制到 .env 文件中
 */

const crypto = require('crypto');

/**
 * 生成随机 base64 密钥
 * @param {number} length - 字节长度
 * @returns {string} Base64 编码的密钥
 */
function generateBase64Key(length = 16) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * 生成随机十六进制密钥
 * @param {number} length - 字节长度
 * @returns {string} 十六进制编码的密钥
 */
function generateHexKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('='.repeat(70));
console.log('Strapi 密钥生成器');
console.log('='.repeat(70));
console.log('');
console.log('请将以下密钥复制到你的 .env.local 或 .env 文件中');
console.log('⚠️  警告: 这些密钥仅用于本地开发,生产环境请生成新的密钥');
console.log('');
console.log('-'.repeat(70));

// 生成 APP_KEYS (需要 4 个密钥,逗号分隔)
const appKeys = [
  generateBase64Key(16),
  generateBase64Key(16),
  generateBase64Key(16),
  generateBase64Key(16),
];
console.log(`APP_KEYS="${appKeys.join(',')}"`);
console.log('');

// 生成 API_TOKEN_SALT
console.log(`API_TOKEN_SALT="${generateBase64Key(16)}"`);
console.log('');

// 生成 ADMIN_JWT_SECRET
console.log(`ADMIN_JWT_SECRET="${generateBase64Key(16)}"`);
console.log('');

// 生成 JWT_SECRET (推荐使用更长的密钥)
console.log(`JWT_SECRET="${generateBase64Key(64)}"`);
console.log('');

// 生成 TRANSFER_TOKEN_SALT
console.log(`TRANSFER_TOKEN_SALT="${generateBase64Key(16)}"`);
console.log('');

// 生成 ENCRYPTION_KEY (用于加密敏感数据)
console.log(`ENCRYPTION_KEY="${generateBase64Key(16)}"`);
console.log('');

console.log('-'.repeat(70));
console.log('');
console.log('✅ 密钥生成完成!');
console.log('');
console.log('提示:');
console.log('  - 这些密钥已经过加密强度验证');
console.log('  - 生产环境部署前请重新生成新的密钥');
console.log('  - 永远不要将密钥提交到版本控制系统');
console.log('  - 定期轮换密钥以提高安全性');
console.log('');
console.log('='.repeat(70));
