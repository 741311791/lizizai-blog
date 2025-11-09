#!/bin/bash

# 安全修复脚本
# 使用方法: chmod +x scripts/security-fix.sh && ./scripts/security-fix.sh

set -e

echo "🔐 博客项目安全修复脚本"
echo "=========================="
echo ""

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ] && [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  警告: 此脚本将执行以下操作:${NC}"
echo "1. 从 Git 历史中移除 .env.production"
echo "2. 更新 .gitignore 配置"
echo "3. 生成新的安全密钥"
echo "4. 更新后端依赖项"
echo ""

read -p "是否继续? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "取消操作"
    exit 0
fi

echo ""
echo -e "${GREEN}步骤 1: 备份当前配置${NC}"
echo "----------------------------------------"

# 备份现有配置
BACKUP_DIR="backups/security-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "backend/.env" ]; then
    cp backend/.env "$BACKUP_DIR/.env"
    echo "✅ 已备份 backend/.env"
fi

if [ -f "backend/.env.production" ]; then
    cp backend/.env.production "$BACKUP_DIR/.env.production"
    echo "✅ 已备份 backend/.env.production"
fi

echo ""
echo -e "${GREEN}步骤 2: 更新 .gitignore${NC}"
echo "----------------------------------------"

# 确保后端 .gitignore 包含所有 .env 文件
if ! grep -q "^.env.production$" backend/.gitignore; then
    echo ".env.production" >> backend/.gitignore
    echo "✅ 添加 .env.production 到 backend/.gitignore"
fi

if ! grep -q "^.env.local$" backend/.gitignore; then
    echo ".env.local" >> backend/.gitignore
    echo "✅ 添加 .env.local 到 backend/.gitignore"
fi

if ! grep -q "^.env.*.local$" backend/.gitignore; then
    echo ".env*.local" >> backend/.gitignore
    echo "✅ 添加 .env*.local 到 backend/.gitignore"
fi

echo ""
echo -e "${YELLOW}步骤 3: 从 Git 历史移除敏感文件${NC}"
echo "----------------------------------------"
echo -e "${RED}⚠️  警告: 此操作将重写 Git 历史!${NC}"
echo "执行前建议:"
echo "1. 确保所有团队成员已提交代码"
echo "2. 通知团队成员稍后重新克隆仓库"
echo ""

read -p "是否执行 Git 历史重写? (yes/no): " git_confirm
if [ "$git_confirm" = "yes" ]; then
    echo "正在从 Git 历史中移除 backend/.env.production..."

    # 使用 git filter-branch 移除文件
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch backend/.env.production" \
        --prune-empty --tag-name-filter cat -- --all

    echo "✅ 已从 Git 历史中移除 backend/.env.production"
    echo ""
    echo -e "${YELLOW}下一步操作:${NC}"
    echo "1. 运行: git push origin --force --all"
    echo "2. 运行: git push origin --force --tags"
    echo "3. 通知所有团队成员重新克隆仓库"
else
    echo "⏭️  跳过 Git 历史重写"
fi

echo ""
echo -e "${GREEN}步骤 4: 生成新的安全密钥${NC}"
echo "----------------------------------------"

# 生成新密钥
echo "生成新的安全密钥..."

ADMIN_JWT_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
API_TOKEN_SALT=$(openssl rand -base64 16)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 16)
ENCRYPTION_KEY=$(openssl rand -hex 32)
APP_KEY1=$(openssl rand -base64 16)
APP_KEY2=$(openssl rand -base64 16)
APP_KEY3=$(openssl rand -base64 16)
APP_KEY4=$(openssl rand -base64 16)

# 创建新的 .env.local 文件
cat > backend/.env.local <<EOF
# 安全密钥（由 security-fix.sh 生成）
# 生成日期: $(date)

ADMIN_JWT_SECRET="$ADMIN_JWT_SECRET"
JWT_SECRET="$JWT_SECRET"
API_TOKEN_SALT="$API_TOKEN_SALT"
TRANSFER_TOKEN_SALT="$TRANSFER_TOKEN_SALT"
ENCRYPTION_KEY="$ENCRYPTION_KEY"
APP_KEYS="$APP_KEY1,$APP_KEY2,$APP_KEY3,$APP_KEY4"

# 数据库配置（请手动填写）
DATABASE_CLIENT=postgres
DATABASE_URL=<请填写数据库 URL>
DATABASE_HOST=<请填写>
DATABASE_PORT=6543
DATABASE_NAME=postgres
DATABASE_USERNAME=<请填写>
DATABASE_PASSWORD=<请填写>
DATABASE_SCHEMA=public
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# 邮件服务（请手动填写）
RESEND_API_KEY=<请填写新的 API Key>
EMAIL_FROM="Zizai Li <newsletter@lizizai.xyz>"

# 前端 URL
FRONTEND_URL=https://lizizai.xyz

# 环境
NODE_ENV=production
HOST=0.0.0.0
PORT=10000
EOF

echo "✅ 已创建 backend/.env.local（包含新密钥）"
echo ""
echo -e "${YELLOW}⚠️  请手动完成以下操作:${NC}"
echo "1. 编辑 backend/.env.local，填写数据库和邮件配置"
echo "2. 在 Render.com 更新环境变量:"
echo "   - ADMIN_JWT_SECRET"
echo "   - JWT_SECRET"
echo "   - API_TOKEN_SALT"
echo "   - TRANSFER_TOKEN_SALT"
echo "   - ENCRYPTION_KEY"
echo "   - APP_KEYS"
echo "3. 重置数据库密码（在 Supabase 控制台）"
echo "4. 撤销并重新生成 Resend API Key"

echo ""
echo -e "${GREEN}步骤 5: 更新后端依赖项${NC}"
echo "----------------------------------------"

cd backend

echo "检查依赖项更新..."
pnpm outdated

read -p "是否更新后端依赖项? (yes/no): " update_confirm
if [ "$update_confirm" = "yes" ]; then
    echo "更新依赖项..."
    pnpm update
    echo "✅ 依赖项已更新"

    echo "运行安全审计..."
    pnpm audit || true
else
    echo "⏭️  跳过依赖项更新"
fi

cd ..

echo ""
echo -e "${GREEN}步骤 6: 创建安全配置文件${NC}"
echo "----------------------------------------"

# 创建速率限制配置示例
mkdir -p backend/config/security

cat > backend/config/security/rate-limit.example.ts <<'EOF'
/**
 * 速率限制配置示例
 *
 * 使用方法:
 * 1. 复制此文件为 rate-limit.ts
 * 2. 安装依赖: pnpm add koa-ratelimit ioredis
 * 3. 在 middlewares.ts 中导入并使用
 */

import rateLimit from 'koa-ratelimit';
import Redis from 'ioredis';

// Redis 配置
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
});

/**
 * 订阅端点速率限制
 * 每 IP 每分钟最多 3 次请求
 */
export const subscribeRateLimit = rateLimit({
  driver: 'redis',
  db: redis,
  duration: 60000, // 1 分钟
  max: 3,
  id: (ctx) => ctx.ip,
  errorMessage: 'Too many subscription attempts. Please try again later.',
});

/**
 * API 通用速率限制
 * 每 IP 每分钟最多 60 次请求
 */
export const generalRateLimit = rateLimit({
  driver: 'redis',
  db: redis,
  duration: 60000,
  max: 60,
  id: (ctx) => ctx.ip,
  errorMessage: 'Too many requests. Please slow down.',
});
EOF

echo "✅ 已创建速率限制配置示例"

# 创建环境变量验证示例
cat > backend/src/utils/env-validator.example.ts <<'EOF'
/**
 * 环境变量验证示例
 *
 * 使用方法:
 * 1. 复制此文件为 env-validator.ts
 * 2. 在 backend/src/index.ts 启动时调用 validateEnv()
 */

import { z } from 'zod';

const envSchema = z.object({
  // 必需的密钥
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, 'ADMIN_JWT_SECRET 必须至少 32 字符'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET 必须至少 32 字符'),
  API_TOKEN_SALT: z
    .string()
    .min(16, 'API_TOKEN_SALT 必须至少 16 字符'),
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY 必须是 64 位十六进制'),

  // 数据库配置
  DATABASE_URL: z.string().url('DATABASE_URL 必须是有效的 URL'),
  DATABASE_SSL: z.enum(['true', 'false']).default('true'),

  // API 密钥
  RESEND_API_KEY: z
    .string()
    .regex(/^re_[a-zA-Z0-9_]+$/, 'RESEND_API_KEY 格式不正确'),

  // URLs
  FRONTEND_URL: z.string().url('FRONTEND_URL 必须是有效的 URL'),

  // 环境
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      console.error('\n请检查您的 .env 文件，确保所有必需的环境变量都已正确配置。');
      process.exit(1);
    }
    throw error;
  }
}
EOF

echo "✅ 已创建环境变量验证示例"

echo ""
echo -e "${GREEN}✅ 安全修复脚本执行完成!${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}后续操作清单:${NC}"
echo ""
echo "[ ] 1. 填写 backend/.env.local 中的数据库和邮件配置"
echo "[ ] 2. 在 Render.com 更新所有环境变量"
echo "[ ] 3. 重置 Supabase 数据库密码"
echo "[ ] 4. 撤销并重新生成 Resend API Key"
echo "[ ] 5. 如果执行了 Git 历史重写:"
echo "        - git push origin --force --all"
echo "        - git push origin --force --tags"
echo "        - 通知团队成员重新克隆仓库"
echo "[ ] 6. 测试应用功能是否正常"
echo "[ ] 7. 实施速率限制（参考 backend/config/security/rate-limit.example.ts）"
echo "[ ] 8. 添加环境变量验证（参考 backend/src/utils/env-validator.example.ts）"
echo ""
echo -e "${GREEN}备份位置: $BACKUP_DIR${NC}"
echo ""
echo "详细安全报告: SECURITY_AUDIT_REPORT.md"
