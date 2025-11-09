# 🔐 安全修复检查清单

**项目**: Lizizai Blog
**评估日期**: 2025-11-09
**当前状态**: 🔴 高危

---

## 🚨 紧急修复（立即执行）

### 1. 移除 Git 历史中的敏感信息

- [ ] **备份当前仓库**
  ```bash
  git clone --mirror <repo-url> backup-$(date +%Y%m%d)
  ```

- [ ] **运行自动修复脚本**
  ```bash
  cd /Users/louie/Documents/Vibecoding/lizizai-blog
  ./scripts/security-fix.sh
  ```
  或手动执行:

- [ ] **更新 .gitignore**
  ```bash
  echo ".env.production" >> backend/.gitignore
  echo ".env.local" >> backend/.gitignore
  ```

- [ ] **从 Git 历史移除敏感文件**
  ```bash
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch backend/.env.production" \
    --prune-empty --tag-name-filter cat -- --all
  ```

- [ ] **强制推送更新**
  ```bash
  git push origin --force --all
  git push origin --force --tags
  ```

- [ ] **通知所有团队成员重新克隆仓库**
  - 发送通知邮件
  - 在 Slack/Teams 发布公告

---

### 2. 轮换所有密钥和凭据

#### 2.1 生成新密钥

- [ ] **生成 ADMIN_JWT_SECRET**
  ```bash
  openssl rand -base64 32
  ```
  新值: `______________________________`

- [ ] **生成 JWT_SECRET**
  ```bash
  openssl rand -base64 64
  ```
  新值: `______________________________`

- [ ] **生成 API_TOKEN_SALT**
  ```bash
  openssl rand -base64 16
  ```
  新值: `______________________________`

- [ ] **生成 TRANSFER_TOKEN_SALT**
  ```bash
  openssl rand -base64 16
  ```
  新值: `______________________________`

- [ ] **生成 ENCRYPTION_KEY**
  ```bash
  openssl rand -hex 32
  ```
  新值: `______________________________`

- [ ] **生成 APP_KEYS (4个)**
  ```bash
  for i in {1..4}; do openssl rand -base64 16; done
  ```

#### 2.2 更新 Render.com 环境变量

登录 [Render Dashboard](https://dashboard.render.com/)

- [ ] 选择后端服务
- [ ] 更新 `ADMIN_JWT_SECRET`
- [ ] 更新 `JWT_SECRET`
- [ ] 更新 `API_TOKEN_SALT`
- [ ] 更新 `TRANSFER_TOKEN_SALT`
- [ ] 更新 `ENCRYPTION_KEY`
- [ ] 更新 `APP_KEYS`
- [ ] 更新 `DATABASE_SSL=true`
- [ ] 保存并触发重新部署

#### 2.3 重置数据库密码

登录 [Supabase Dashboard](https://app.supabase.com/)

- [ ] 选择项目
- [ ] 进入 Settings > Database
- [ ] 点击 "Reset database password"
- [ ] 保存新密码: `______________________________`
- [ ] 在 Render.com 更新 `DATABASE_PASSWORD`
- [ ] 更新 `DATABASE_URL`

#### 2.4 重新生成 Resend API Key

登录 [Resend Dashboard](https://resend.com/api-keys)

- [ ] 撤销旧 API Key: `re_6Vhy7ZyZ_C7HEdztmpwtXt6A4fozttr2G`
- [ ] 创建新 API Key
- [ ] 保存新密钥: `______________________________`
- [ ] 在 Render.com 更新 `RESEND_API_KEY`

---

### 3. 启用数据库 SSL

- [ ] **在 Render.com 设置**
  ```
  DATABASE_SSL=true
  DATABASE_SSL_REJECT_UNAUTHORIZED=true
  ```

- [ ] **验证连接**
  ```bash
  # 查看数据库日志确认 SSL 连接
  ```

---

## 🟠 短期修复（1-7天内）

### 4. 修复 CORS 配置

- [ ] **编辑 `backend/config/middlewares.ts`**
  ```typescript
  origin: [
    'http://localhost:3000',
    'https://lizizai.xyz',
    'https://www.lizizai.xyz',
    // 移除: 'https://*.vercel.app',
  ]
  ```

- [ ] **测试 CORS 配置**
  ```bash
  curl -H "Origin: https://malicious-site.com" \
    https://lizizai-blog.onrender.com/api/subscribers/count
  # 应返回 CORS 错误
  ```

---

### 5. 实施速率限制

- [ ] **安装依赖**
  ```bash
  cd backend
  pnpm add koa-ratelimit ioredis
  ```

- [ ] **创建配置文件**
  - 复制 `backend/config/security/rate-limit.example.ts`
  - 调整为实际配置

- [ ] **应用到订阅端点**
  - 每 IP 每分钟最多 3 次订阅请求

- [ ] **测试速率限制**
  ```bash
  # 快速发送 5 次请求，第 4 次应被限制
  for i in {1..5}; do
    curl -X POST https://lizizai-blog.onrender.com/api/subscribers/subscribe \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com"}' &
  done
  ```

---

### 6. 增强输入验证

- [ ] **安装 Zod（如未安装）**
  ```bash
  cd backend
  pnpm add zod
  ```

- [ ] **创建验证 Schema**
  ```typescript
  const subscribeSchema = z.object({
    email: z.string().email().max(255).toLowerCase(),
    name: z.string().max(100).regex(/^[a-zA-Z0-9\s\u4e00-\u9fa5-]+$/),
  });
  ```

- [ ] **应用到所有 API 端点**
  - `/api/subscribers/subscribe`
  - `/api/subscribers/unsubscribe`
  - `/api/subscribers/confirm`

- [ ] **测试输入验证**
  ```bash
  # 测试 XSS 防护
  curl -X POST https://lizizai-blog.onrender.com/api/subscribers/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","name":"<script>alert(1)</script>"}'
  # 应返回验证错误
  ```

---

### 7. 添加 Content Security Policy (CSP)

- [ ] **合并 `frontend/next.config.security.example.ts`**
  - 复制 headers 配置到 `next.config.ts`

- [ ] **调整 CSP 策略**
  - 移除 `'unsafe-eval'`（生产环境）
  - 添加 nonce 支持（可选）

- [ ] **部署并验证**
  - 使用 [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
  - 检查浏览器控制台无 CSP 错误

---

### 8. 升级依赖项

- [ ] **后端依赖更新**
  ```bash
  cd backend
  pnpm outdated
  pnpm update
  pnpm audit
  ```

- [ ] **修复已知漏洞**
  - Koa: 升级到 2.16.2+
  - ESBuild: 升级到 0.24.3+
  - tmp: 升级到 0.2.4+

- [ ] **前端依赖检查**
  ```bash
  cd frontend
  pnpm audit
  # 应显示: No known vulnerabilities found
  ```

---

## 🟡 中期改进（1-4周内）

### 9. 实施环境变量验证

- [ ] **复制验证文件**
  ```bash
  cp backend/src/utils/env-validator.example.ts \
     backend/src/utils/env-validator.ts
  ```

- [ ] **集成到启动流程**
  ```typescript
  // backend/src/index.ts
  import { validateEnv } from './utils/env-validator';
  validateEnv(); // 启动时验证
  ```

- [ ] **测试验证**
  ```bash
  # 移除必需环境变量测试
  unset DATABASE_URL
  npm run start
  # 应显示验证错误并退出
  ```

---

### 10. 增强 Token 安全性

- [ ] **实施 Token 签名**
  - 使用 HMAC 签名确认 Token

- [ ] **添加使用次数限制**
  - Token 只能使用一次

- [ ] **Token 黑名单机制**
  - 使用 Redis 存储已使用的 Token

---

### 11. 改进日志系统

- [ ] **脱敏敏感信息**
  ```typescript
  logger.sensitive(
    'Confirmation URL',
    url.replace(/token=[^&]+/, 'token=***')
  );
  ```

- [ ] **结构化日志**
  ```typescript
  logger.info({
    action: 'subscription_confirmed',
    userId: subscriber.id,
    timestamp: new Date().toISOString(),
  });
  ```

- [ ] **生产环境日志级别**
  - 设置 `LOG_LEVEL=info`
  - 移除 debug 日志

---

## 🟢 长期优化（1-3月内）

### 12. 密钥管理服务

- [ ] **评估密钥管理服务**
  - AWS Secrets Manager
  - HashiCorp Vault
  - Doppler

- [ ] **迁移密钥到管理服务**

- [ ] **实施自动轮换**

---

### 13. 安全审计自动化

- [ ] **配置 Dependabot**
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/backend"
      schedule:
        interval: "weekly"
  ```

- [ ] **CI/CD 安全扫描**
  ```yaml
  # .github/workflows/security.yml
  - name: Security Audit
    run: pnpm audit
  ```

- [ ] **定期扫描计划**
  - 每周依赖扫描
  - 每月全面审计

---

### 14. 渗透测试

- [ ] **内部渗透测试**
  - 使用 OWASP ZAP
  - 模拟常见攻击

- [ ] **外部专家评估**
  - 雇佣安全专家
  - 获取专业报告

---

## ✅ 验证和测试

### 功能测试

- [ ] **订阅流程**
  ```bash
  # 1. 订阅
  curl -X POST https://lizizai-blog.onrender.com/api/subscribers/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","name":"Test User"}'

  # 2. 检查邮件
  # 3. 点击确认链接
  # 4. 验证确认成功
  ```

- [ ] **速率限制**
  - 快速发送多次请求
  - 验证被限制

- [ ] **输入验证**
  - 测试 XSS payload
  - 测试超长输入
  - 测试特殊字符

- [ ] **CORS**
  - 从允许的源访问
  - 从禁止的源访问

### 安全扫描

- [ ] **依赖漏洞**
  ```bash
  pnpm audit
  ```

- [ ] **CSP 验证**
  - 使用 CSP Evaluator
  - 检查浏览器控制台

- [ ] **SSL/TLS**
  - 使用 [SSL Labs](https://www.ssllabs.com/ssltest/)
  - 验证 A+ 评级

- [ ] **安全头**
  - 使用 [Security Headers](https://securityheaders.com/)
  - 验证所有头都正确设置

---

## 📊 进度跟踪

| 类别 | 总数 | 已完成 | 进度 |
|------|------|--------|------|
| 🚨 紧急修复 | 3 | 0 | ░░░░░░░░░░ 0% |
| 🟠 短期修复 | 5 | 0 | ░░░░░░░░░░ 0% |
| 🟡 中期改进 | 3 | 0 | ░░░░░░░░░░ 0% |
| 🟢 长期优化 | 3 | 0 | ░░░░░░░░░░ 0% |
| **总计** | **14** | **0** | **░░░░░░░░░░ 0%** |

---

## 📝 完成签名

| 检查项 | 负责人 | 完成日期 | 签名 |
|--------|--------|----------|------|
| 紧急修复 | _______ | ________ | ____ |
| 短期修复 | _______ | ________ | ____ |
| 中期改进 | _______ | ________ | ____ |
| 长期优化 | _______ | ________ | ____ |

---

## 🔄 下次审计

- **计划日期**: 2025-12-09（30天后）
- **负责人**: _______________________
- **重点检查**:
  - 密钥是否定期轮换
  - 依赖项是否更新
  - 新功能是否通过安全审查

---

**最后更新**: 2025-11-09
**版本**: 1.0
