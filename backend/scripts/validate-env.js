#!/usr/bin/env node

/**
 * 验证环境变量配置
 *
 * 使用方法:
 *   node scripts/validate-env.js
 *   或在 package.json 中添加: "validate:env": "node scripts/validate-env.js"
 *
 * 这将检查必需的环境变量是否已配置,并验证其安全性
 */

const fs = require('fs');
const path = require('path');

// 定义必需的环境变量
const REQUIRED_VARS = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
  'DATABASE_CLIENT',
];

// 定义危险的默认值（不应在生产环境使用）
const DANGEROUS_DEFAULTS = [
  'GENERATE_RANDOM_KEY',
  'GENERATE_RANDOM_SALT',
  'GENERATE_RANDOM_SECRET',
  'GENERATE_RANDOM_ENCRYPTION_KEY',
  'changeme',
  'secret',
  'password',
  'strapi',
];

// 定义不同环境的特定要求
const ENV_SPECIFIC_REQUIREMENTS = {
  production: [
    'DATABASE_URL',
    'FRONTEND_URL',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'ENCRYPTION_KEY',
  ],
  development: [],
};

/**
 * 加载 .env 文件
 * @param {string} filePath - .env 文件路径
 * @returns {Object} 环境变量对象
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    // 跳过注释和空行
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // 移除引号
      env[key] = value;
    }
  });

  return env;
}

/**
 * 检查是否包含危险的默认值
 * @param {string} value - 环境变量值
 * @returns {boolean}
 */
function hasDangerousDefault(value) {
  return DANGEROUS_DEFAULTS.some(dangerous =>
    value.toUpperCase().includes(dangerous.toUpperCase())
  );
}

/**
 * 验证密钥强度
 * @param {string} key - 密钥名称
 * @param {string} value - 密钥值
 * @returns {Object} 验证结果 {valid: boolean, message: string}
 */
function validateKeyStrength(key, value) {
  // APP_KEYS 需要包含多个密钥
  if (key === 'APP_KEYS') {
    const keys = value.split(',');
    if (keys.length < 4) {
      return {
        valid: false,
        message: 'APP_KEYS 应包含至少 4 个逗号分隔的密钥',
      };
    }

    for (const k of keys) {
      if (k.trim().length < 16) {
        return {
          valid: false,
          message: 'APP_KEYS 中的每个密钥长度应至少为 16 个字符',
        };
      }
    }
  }

  // JWT 密钥应该足够长
  if (key.includes('JWT') || key.includes('SECRET')) {
    if (value.length < 32) {
      return {
        valid: false,
        message: `${key} 长度应至少为 32 个字符`,
      };
    }
  }

  // SALT 应该足够长
  if (key.includes('SALT')) {
    if (value.length < 16) {
      return {
        valid: false,
        message: `${key} 长度应至少为 16 个字符`,
      };
    }
  }

  return { valid: true, message: '' };
}

/**
 * 主验证函数
 */
function validateEnvironment() {
  console.log('='.repeat(70));
  console.log('环境变量验证器');
  console.log('='.repeat(70));
  console.log('');

  // 确定当前环境
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`当前环境: ${nodeEnv}`);
  console.log('');

  // 尝试加载 .env 文件
  const envFiles = ['.env.local', '.env'];
  let env = null;
  let loadedFile = null;

  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    env = loadEnvFile(filePath);
    if (env) {
      loadedFile = file;
      break;
    }
  }

  if (!env) {
    console.log('❌ 错误: 未找到 .env.local 或 .env 文件');
    console.log('');
    console.log('请创建 .env.local 文件并配置必需的环境变量');
    console.log('你可以使用 scripts/generate-secrets.js 生成密钥');
    process.exit(1);
  }

  console.log(`✅ 已加载环境文件: ${loadedFile}`);
  console.log('');
  console.log('-'.repeat(70));

  // 获取当前环境的特定要求
  const requiredForEnv = [
    ...REQUIRED_VARS,
    ...(ENV_SPECIFIC_REQUIREMENTS[nodeEnv] || []),
  ];

  let hasErrors = false;
  let hasWarnings = false;

  // 检查必需的环境变量
  console.log('');
  console.log('检查必需的环境变量:');
  console.log('');

  for (const varName of requiredForEnv) {
    const value = env[varName];

    if (!value) {
      console.log(`  ❌ ${varName}: 缺失`);
      hasErrors = true;
      continue;
    }

    // 检查危险的默认值
    if (hasDangerousDefault(value)) {
      console.log(`  ❌ ${varName}: 使用了不安全的默认值`);
      hasErrors = true;
      continue;
    }

    // 验证密钥强度
    const strengthCheck = validateKeyStrength(varName, value);
    if (!strengthCheck.valid) {
      console.log(`  ⚠️  ${varName}: ${strengthCheck.message}`);
      hasWarnings = true;
      continue;
    }

    console.log(`  ✅ ${varName}: 已配置`);
  }

  // 检查可选但推荐的环境变量
  console.log('');
  console.log('检查推荐的环境变量:');
  console.log('');

  const recommendedVars = {
    CORS_ORIGINS: '配置 CORS 源以提高安全性',
    DATABASE_SSL: '生产环境应启用 SSL 连接',
  };

  for (const [varName, reason] of Object.entries(recommendedVars)) {
    const value = env[varName];
    if (!value) {
      console.log(`  ⚠️  ${varName}: 未配置 - ${reason}`);
      hasWarnings = true;
    } else {
      console.log(`  ✅ ${varName}: 已配置`);
    }
  }

  console.log('');
  console.log('-'.repeat(70));
  console.log('');

  // 总结
  if (hasErrors) {
    console.log('❌ 验证失败: 存在必需的环境变量缺失或配置不当');
    console.log('');
    console.log('请修复以上错误后重试');
    console.log('提示: 运行 node scripts/generate-secrets.js 生成新的密钥');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  验证通过但有警告: 建议修复以上警告项');
    console.log('');
    console.log('应用可以启动,但可能存在安全风险或配置问题');
    process.exit(0);
  } else {
    console.log('✅ 验证通过: 所有环境变量配置正确');
    console.log('');
    process.exit(0);
  }
}

// 运行验证
try {
  validateEnvironment();
} catch (error) {
  console.error('验证过程中发生错误:', error.message);
  process.exit(1);
}
