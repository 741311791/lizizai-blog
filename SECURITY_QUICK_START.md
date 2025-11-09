# 🔐 安全修复快速指南

> **紧急程度**: 🔴 高危 - 需要立即处理
> **预计时间**: 30-60 分钟

---

## ⚡ 快速开始

### 1️⃣ 运行自动修复脚本（推荐）

```bash
cd /Users/louie/Documents/Vibecoding/lizizai-blog
./scripts/security-fix.sh
```

脚本将自动执行:
- ✅ 备份现有配置
- ✅ 更新 .gitignore
- ✅ 生成新的安全密钥
- ✅ 创建安全配置模板
- ⚠️ 可选：从 Git 历史移除敏感文件

---

### 2️⃣ 手动修复步骤

如果不想运行脚本，请按以下步骤操作：

#### 步骤 1: 立即轮换密钥 (⏱️ 5分钟)

```bash
cd backend

# 生成新密钥
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
API_TOKEN_SALT=$(openssl rand -base64 16)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "新密钥已生成，请记录:"
echo "ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET"
echo "JWT_SECRET=$JWT_SECRET"
echo "API_TOKEN_SALT=$API_TOKEN_SALT"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
```

#### 步骤 2: 更新环境变量 (⏱️ 10分钟)

**在 Render.com 后端服务中更新:**

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 选择后端服务 `lizizai-blog`
3. 进入 "Environment" 标签
4. 更新以下变量:
   - `ADMIN_JWT_SECRET` = `<上面生成的值>`
   - `JWT_SECRET` = `<上面生成的值>`
   - `API_TOKEN_SALT` = `<上面生成的值>`
   - `ENCRYPTION_KEY` = `<上面生成的值>`
   - `DATABASE_SSL` = `true`
5. 点击 "Save Changes"
6. 触发重新部署

**在 Vercel 前端项目中检查:**

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 确认环境变量不包含敏感信息

#### 步骤 3: 重置数据库密码 (⏱️ 5分钟)

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目
3. 进入 Settings > Database
4. 点击 "Reset database password"
5. 保存新密码到密码管理器
6. 在 Render.com 更新 `DATABASE_PASSWORD` 和 `DATABASE_URL`

#### 步骤 4: 重新生成 Resend API Key (⏱️ 5分钟)

1. 登录 [Resend Dashboard](https://resend.com/api-keys)
2. 撤销旧的 API Key: `re_6Vhy7ZyZ_C7HEdztmpwtXt6A4fozttr2G`
3. 创建新的 API Key
4. 在 Render.com 更新 `RESEND_API_KEY`

#### 步骤 5: 从 Git 移除敏感文件 (⏱️ 10分钟)

```bash
# ⚠️ 警告: 此操作会重写 Git 历史

cd /Users/louie/Documents/Vibecoding/lizizai-blog

# 确保 .gitignore 包含敏感文件
echo ".env.production" >> backend/.gitignore
echo ".env.local" >> backend/.gitignore

# 从 Git 历史移除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送（需要通知团队成员）
git push origin --force --all
git push origin --force --tags
```

**⚠️ 重要**: 执行后通知所有团队成员重新克隆仓库!

---

## 🛡️ 即时安全加固

### 修复 CORS 配置 (⏱️ 2分钟)

编辑 `/Users/louie/Documents/Vibecoding/lizizai-blog/backend/config/middlewares.ts`:

```typescript
{
  name: 'strapi::cors',
  config: {
    origin: [
      'http://localhost:3000',
      'https://lizizai.xyz',
      'https://www.lizizai.xyz',
      // 移除通配符: 'https://*.vercel.app',
    ],
    // ... 其他配置
  },
}
```

### 添加速率限制 (⏱️ 10分钟)

```bash
cd backend
pnpm add koa-ratelimit
```

创建 `backend/config/rate-limit.ts`:

```typescript
import rateLimit from 'koa-ratelimit';

const db = new Map(); // 内存存储（单实例）

export const subscribeRateLimit = rateLimit({
  driver: 'memory',
  db: db,
  duration: 60000, // 1 分钟
  max: 3, // 最多 3 次请求
  id: (ctx) => ctx.ip,
});
```

应用到路由（需要查阅 Strapi 路由配置文档）。

---

## ✅ 验证修复

### 检查清单

运行以下命令验证修复:

```bash
# 1. 检查 Git 状态
git status
# 确认 .env.production 不在跟踪列表中

# 2. 检查 .env 文件是否 gitignore
git check-ignore -v backend/.env.production
# 应输出: backend/.gitignore:124:.env

# 3. 检查依赖漏洞
cd backend && pnpm audit
cd ../frontend && pnpm audit

# 4. 检查环境变量
echo $DATABASE_SSL  # 应为 true

# 5. 测试订阅功能
curl -X POST https://lizizai-blog.onrender.com/api/subscribers/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test"}'
```

---

## 📊 安全评分

**修复前**: 🔴 3.5/10 (高危)
**修复后预期**: 🟢 8.5/10 (安全)

---

## 🚨 紧急联系

如果遇到问题:
1. 查看详细报告: `SECURITY_AUDIT_REPORT.md`
2. 回滚备份: `backups/security-fix-<timestamp>/`
3. 紧急回滚命令:
   ```bash
   cd backend
   cp ../backups/security-fix-*/.*env* .
   git reset --hard HEAD~1
   ```

---

## 📚 后续阅读

- 完整安全评估报告: [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js 安全最佳实践: https://nodejs.org/en/docs/guides/security/

---

**最后更新**: 2025-11-09
**下次审计**: 建议 30 天内复审
