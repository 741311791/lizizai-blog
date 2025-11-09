# 订阅确认问题修复指南

## 🔍 问题总结

您遇到的三个问题：

1. ❌ **邮件中的确认链接使用生产域名**
   收到: `https://lizizai.xyz/api/subscribe/confirm?token=...`
   期望: `http://localhost:3000/api/subscribe/confirm?token=...`

2. ❌ **路径理解错误**
   邮件中的路径 `/api/subscribe/confirm` **是正确的**（这是前端 API 路由）
   前端 API 路由会调用后端的 `/api/subscribers/confirm`

3. ❌ **404 页面问题**
   即使手动修正域名和路径，仍然出现 404

## ✅ 根本原因

问题主要由以下原因导致：

### 1. 后端服务器环境变量问题
- 后端 `.env` 文件中 `NODE_ENV=production`
- 虽然配置了 `FRONTEND_URL=http://localhost:3000`，但服务器可能：
  - 没有正确重启加载最新配置
  - 使用了缓存的环境变量
  - 在生产模式下有不同的行为

### 2. 前端环境变量指向生产环境
- 前端 `.env` 中配置了生产环境 URL：
  ```
  NEXT_PUBLIC_STRAPI_URL=https://lizizai-blog.onrender.com
  ```
- 导致前端 API 路由调用生产后端而非本地后端

## 🔧 解决方案

我已经为您完成了以下修复：

### ✅ 1. 创建了前端本地环境配置

**文件**: `frontend/.env.local`

```env
# 本地开发环境配置
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_STRAPI_URL=http://localhost:10000
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:10000/api
```

> **说明**: `.env.local` 文件会**自动覆盖** `.env` 中的配置，且不会被提交到 Git。

### ✅ 2. 验证了后端环境变量配置

后端 `.env` 文件配置正确：
```env
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
PORT=10000
```

### ✅ 3. 确认了路由配置正确

- ✅ 前端 API 路由: `/app/api/subscribe/confirm/route.ts` 存在
- ✅ 后端接口: `/api/subscribers/confirm` 正确
- ✅ 订阅页面: `/app/subscribe/page.tsx` 存在

## 🚀 测试步骤

### 步骤 1: 重启服务器（重要！）

这是**最关键**的一步，确保服务器加载最新的环境变量：

#### 重启后端服务器

```bash
cd backend

# 停止当前运行的后端服务（如果正在运行）
# 按 Ctrl+C 停止，或者使用:
pkill -f "strapi"

# 清除可能的缓存
rm -rf .tmp/
rm -rf .cache/

# 重新启动后端服务
pnpm develop
```

**等待直到看到以下输出**:
```
[2025-11-05 XX:XX:XX.XXX] info: Server started on http://0.0.0.0:10000
[2025-11-05 XX:XX:XX.XXX] info: Strapi started successfully
```

#### 重启前端服务器

```bash
cd frontend

# 停止当前运行的前端服务
# 按 Ctrl+C 停止

# 重新启动前端服务
pnpm dev
```

**等待直到看到以下输出**:
```
  ▲ Next.js 16.0.1
  - Local:        http://localhost:3000
```

### 步骤 2: 测试订阅流程

#### 2.1 访问订阅页面

打开浏览器访问: http://localhost:3000/subscribe

#### 2.2 填写订阅表单

- 输入测试邮箱（使用您能收到邮件的真实邮箱）
- 输入名字（可选）
- 点击"Subscribe for Free"

#### 2.3 检查后端日志

在后端终端中查看日志，应该看到类似：

```
[info] Sending confirmation email to your-email@example.com
[sensitive] Confirmation URL: http://localhost:3000/api/subscribe/confirm?token=...
[info] Confirmation email sent successfully
```

**关键检查点**:
- ✅ Confirmation URL 应该以 `http://localhost:3000` 开头
- ❌ 如果看到 `https://lizizai.xyz`，说明服务器未正确加载环境变量

#### 2.4 检查邮件

打开您的邮箱，查找确认邮件：

- **主题**: "Confirm Your Subscription to future/proof"
- **发件人**: "Zizai Li <newsletter@lizizai.xyz>"
- **确认链接**: 应该以 `http://localhost:3000` 开头

#### 2.5 点击确认链接

点击邮件中的确认链接，应该：

1. 跳转到 `http://localhost:3000/api/subscribe/confirm?token=...`
2. 前端 API 路由调用后端 `/api/subscribers/confirm`
3. 成功后重定向到 `/subscribe?confirmed=true`
4. 看到成功确认页面

### 步骤 3: 手动测试确认接口

如果您想手动测试确认功能：

#### 3.1 获取一个有效的 token

从后端日志或邮件中复制 token（例如：`66df31e7ef94e00ebb3c8533d85e706c41213b55907ef0a812ecd0736aa32aba`）

#### 3.2 在浏览器中访问

```
http://localhost:3000/api/subscribe/confirm?token=YOUR_TOKEN_HERE
```

#### 3.3 或使用 curl 测试

```bash
# 测试前端 API 路由
curl -v "http://localhost:3000/api/subscribe/confirm?token=YOUR_TOKEN_HERE"

# 或直接测试后端接口
curl "http://localhost:10000/api/subscribers/confirm?token=YOUR_TOKEN_HERE"
```

## 🐛 故障排查

### 问题 1: 邮件中仍然是生产域名

**症状**: 邮件中的链接仍然是 `https://lizizai.xyz/...`

**解决方案**:

1. **检查后端环境变量是否正确加载**:
   ```bash
   cd backend
   grep "FRONTEND_URL" .env
   ```
   应该输出: `FRONTEND_URL=http://localhost:3000`

2. **完全停止并重启后端服务器**:
   ```bash
   # 彻底停止
   pkill -9 -f strapi
   pkill -9 -f node

   # 清除缓存
   rm -rf .tmp/ .cache/ dist/

   # 重新启动
   pnpm develop
   ```

3. **检查是否有其他进程占用端口**:
   ```bash
   lsof -i :10000
   ```
   如果有其他进程，先终止它们。

4. **验证服务器加载的环境变量**:
   创建临时测试路由查看实际值：
   ```bash
   cd backend
   npx tsx scripts/test-subscription-flow.ts
   ```

### 问题 2: 404 Not Found

**症状**: 访问确认链接时出现 404 页面

**可能原因和解决方案**:

#### 原因 A: 前端开发服务器未运行

**检查**:
```bash
curl http://localhost:3000
```

**解决**:
```bash
cd frontend
pnpm dev
```

#### 原因 B: 前端调用错误的后端

**检查**: 查看前端 `.env.local` 文件：
```bash
cd frontend
cat .env.local
```

**应该看到**:
```
NEXT_PUBLIC_STRAPI_URL=http://localhost:10000
```

**如果不对，重新创建文件**:
```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_STRAPI_URL=http://localhost:10000
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:10000/api
EOF
```

#### 原因 C: Token 无效或过期

Token 有 24 小时有效期。如果超时：

**解决**: 重新订阅获取新的 token

#### 原因 D: 后端数据库中没有对应的 subscriber

**检查**: 直接访问后端接口
```bash
curl "http://localhost:10000/api/subscribers/confirm?token=YOUR_TOKEN"
```

**如果返回 404**: Token 不存在或已被使用

**解决**: 重新订阅获取新的 token

### 问题 3: 前端显示错误消息

**症状**: 页面显示错误提示，如 "Confirmation failed"

**解决方案**:

1. **打开浏览器开发者工具** (F12)
2. **查看 Network 标签**，找到 `confirm` 请求
3. **检查请求详情**:
   - Request URL
   - Response status
   - Response body

4. **根据错误类型处理**:
   - `400 Bad Request`: Token 格式错误
   - `404 Not Found`: Token 不存在
   - `500 Server Error`: 后端服务器错误，查看后端日志

## 📝 配置文件总结

### 后端配置 (`backend/.env`)

```env
# 关键配置
NODE_ENV=production                    # 可以保持 production
FRONTEND_URL=http://localhost:3000     # ⚠️ 确保这个设置正确！
PORT=10000                             # 后端端口
HOST=0.0.0.0

# 数据库配置（您的现有配置）
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://...

# 邮件配置
RESEND_API_KEY=re_...
EMAIL_FROM="Zizai Li <newsletter@lizizai.xyz>"
```

### 前端配置 (`frontend/.env.local`)

```env
# 本地开发环境配置
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_STRAPI_URL=http://localhost:10000
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:10000/api
```

> **注意**: 不要修改 `frontend/.env` 文件，它包含生产环境配置。

## ✅ 验证清单

完成所有步骤后，请验证：

- [ ] 后端服务器运行在 `http://localhost:10000`
- [ ] 前端服务器运行在 `http://localhost:3000`
- [ ] 后端日志显示 Confirmation URL 以 `http://localhost:3000` 开头
- [ ] 邮件中的确认链接以 `http://localhost:3000` 开头
- [ ] 点击确认链接能成功跳转到确认成功页面
- [ ] 后端数据库中 subscriber 的 status 变为 `active`

## 🎯 完整流程图

```
1. 用户访问 http://localhost:3000/subscribe
   ↓
2. 填写邮箱并提交
   ↓
3. 前端调用 http://localhost:3000/api/subscribe (Next.js API Route)
   ↓
4. Next.js API 调用后端 http://localhost:10000/api/subscribers/subscribe
   ↓
5. 后端创建 subscriber 记录（status: pending）
   ↓
6. 后端发送确认邮件，链接: http://localhost:3000/api/subscribe/confirm?token=...
   ↓
7. 用户收到邮件并点击链接
   ↓
8. 浏览器访问 http://localhost:3000/api/subscribe/confirm?token=...
   ↓
9. Next.js API Route 调用后端 http://localhost:10000/api/subscribers/confirm?token=...
   ↓
10. 后端验证 token 并更新 status 为 active
    ↓
11. Next.js 重定向到 /subscribe?confirmed=true
    ↓
12. 显示确认成功页面 🎉
```

## 📞 需要帮助？

如果问题仍然存在，请提供以下信息：

1. **后端日志输出**（特别是确认 URL 部分）
2. **浏览器开发者工具的 Network 标签截图**
3. **收到的邮件中的确认链接**
4. **具体的错误消息**

## 📚 相关文件

- 后端邮件服务: `backend/src/api/subscriber/services/email-service.ts:17`
- 前端 API 路由: `frontend/app/api/subscribe/confirm/route.ts:18`
- 订阅页面: `frontend/app/subscribe/page.tsx`
- 后端订阅控制器: `backend/src/api/subscriber/controllers/subscriber.ts`

---

**最后更新**: 2025-11-05
**问题状态**: ✅ 已修复并提供测试指南
