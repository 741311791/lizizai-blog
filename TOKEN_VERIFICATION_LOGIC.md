# Strapi 订阅确认 Token 验证逻辑详解

## 完整代码路径

**文件：** `/backend/src/api/subscriber/controllers/subscriber.ts`  
**方法：** `confirm()`  
**路由：** `GET /api/subscribers/confirm?token={token}`

---

## 完整验证流程

### 1. 接收 Token

```typescript
async confirm(ctx: any) {
  try {
    const { token } = ctx.query;

    // 步骤 1: 验证 token 是否存在
    if (!token) {
      return ctx.badRequest('Confirmation token is required');
    }
```

**可能的错误：**
- ❌ URL 中没有 `token` 参数 → 返回 400 Bad Request

---

### 2. 查询数据库

```typescript
    // 步骤 2: 在数据库中查找匹配的订阅者
    strapi.log.info(`Confirming subscription with token: ${token}`);
    
    const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
      where: { confirmationToken: token },
    });

    strapi.log.info(`Subscriber found: ${subscriber ? 'Yes' : 'No'}`);
    if (subscriber) {
      strapi.log.info(`Subscriber details: ${JSON.stringify({
        id: subscriber.id,
        email: subscriber.email,
        status: subscriber.status,
        hasToken: !!subscriber.confirmationToken,
        tokenMatch: subscriber.confirmationToken === token
      })}`);
    }

    // 步骤 3: 如果找不到订阅者，返回 404
    if (!subscriber) {
      return ctx.notFound('Invalid confirmation token');  // ← 这里返回 404
    }
```

**查询逻辑：**
- 使用 `confirmationToken` 字段精确匹配
- 如果数据库中没有匹配的记录 → 返回 404 Not Found

**可能导致 404 的原因：**
1. ✅ Token 从未存储到数据库
2. ✅ Token 已被清空（确认成功后会设置为 `null`）
3. ✅ Token 不匹配（大小写、空格、特殊字符）
4. ✅ 数据库字段名不匹配（camelCase vs snake_case）

---

### 3. 检查 Token 过期

```typescript
    // 步骤 4: 检查 token 是否过期
    if (subscriber.tokenExpiresAt && new Date(subscriber.tokenExpiresAt) < new Date()) {
      return ctx.badRequest('Confirmation token has expired. Please subscribe again.');
    }
```

**过期逻辑：**
- Token 有效期：24 小时
- 如果 `tokenExpiresAt < 当前时间` → 返回 400 Bad Request

---

### 4. 检查是否已确认

```typescript
    // 步骤 5: 检查是否已经确认过
    if (subscriber.status === 'active' && subscriber.confirmedAt) {
      return ctx.send({ 
        message: 'Email already confirmed',
        alreadyConfirmed: true 
      });
    }
```

**重复确认处理：**
- 如果已经确认过 → 返回成功消息（不是错误）
- 但这种情况下 `confirmationToken` 应该已经是 `null`，所以不会走到这一步

---

### 5. 更新订阅者状态

```typescript
    // 步骤 6: 更新订阅者状态为 active
    await strapi.db.query('api::subscriber.subscriber').update({
      where: { id: subscriber.id },
      data: {
        status: 'active',
        confirmedAt: new Date(),
        confirmationToken: null,        // ← 清空 token
        tokenExpiresAt: null,
      },
    });
```

**关键操作：**
- ✅ 设置 `status = 'active'`
- ✅ 记录 `confirmedAt` 时间
- ✅ **清空 `confirmationToken`** ← 这导致同一个链接不能再次使用

---

### 6. 发送欢迎邮件

```typescript
    // 步骤 7: 发送欢迎邮件
    try {
      await sendWelcomeEmail(subscriber.email, subscriber.name || '');
      strapi.log.info(`Welcome email sent to ${subscriber.email}`);
    } catch (emailError) {
      strapi.log.error('Failed to send welcome email:', emailError);
      // 不阻止确认成功，只记录错误
    }

    // 步骤 8: 返回成功响应
    return ctx.send({ 
      message: 'Subscription confirmed successfully! Welcome to future/proof.',
      success: true 
    });
```

---

## 前端如何处理响应

**文件：** `/frontend/app/api/subscribe/confirm/route.ts`

```typescript
export async function GET(request: NextRequest) {
  try {
    const token = searchParams.get('token');
    
    // 调用后端 API
    const response = await fetch(
      `${STRAPI_URL}/api/subscribers/confirm?token=${token}`,
      { method: 'GET' }
    );

    const data = await response.json();

    // 处理不同的错误状态
    if (!response.ok) {
      if (response.status === 404) {
        // ← 这里捕获 404 错误
        return NextResponse.redirect(
          new URL('/subscribe?error=invalid_token', request.url)
        );
      }
      if (response.status === 400 && data.error?.message?.includes('expired')) {
        return NextResponse.redirect(
          new URL('/subscribe?error=token_expired', request.url)
        );
      }
      return NextResponse.redirect(
        new URL('/subscribe?error=confirmation_failed', request.url)
      );
    }

    // 成功 - 重定向到成功页面
    return NextResponse.redirect(
      new URL('/subscribe?confirmed=true', request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL('/subscribe?error=server_error', request.url)
    );
  }
}
```

**错误映射：**
- `404 Not Found` → `error=invalid_token` → "Confirmation link is invalid or has already been used"
- `400 Bad Request (expired)` → `error=token_expired` → "Confirmation link has expired"
- 其他错误 → `error=confirmation_failed` → "Confirmation failed"

---

## 问题排查清单

### 为什么会出现 404 错误？

#### 可能原因 1: Token 未正确存储

**检查点：**
```typescript
// 订阅时生成 token
const confirmationToken = crypto.randomBytes(32).toString('hex');

// 存储到数据库
subscriber = await strapi.db.query('api::subscriber.subscriber').create({
  data: {
    email: email.toLowerCase(),
    confirmationToken,  // ← 是否正确存储？
    // ...
  },
});
```

**验证方法：**
- 查看 Render 日志中的 `Generated token for [email]:` 
- 直接查询数据库 `SELECT confirmation_token FROM subscribers WHERE email = '...'`

---

#### 可能原因 2: 字段名映射问题

**Strapi Schema (camelCase):**
```json
{
  "confirmationToken": {
    "type": "string"
  }
}
```

**数据库表 (snake_case):**
```sql
CREATE TABLE subscribers (
  confirmation_token VARCHAR(255)
);
```

**Strapi 应该自动处理映射，但可能存在问题。**

**验证方法：**
- 检查数据库实际的列名：`\d subscribers` (PostgreSQL)
- 确认 Strapi 是否正确映射字段名

---

#### 可能原因 3: Token 已被清空

**场景：**
1. 用户第一次点击确认链接 → 成功
2. Token 被设置为 `null`
3. 用户再次点击同一个链接 → 404

**验证方法：**
- 查看数据库中的 `confirmation_token` 是否为 `NULL`
- 检查 `confirmed_at` 是否有值
- 检查 `status` 是否为 `'active'`

---

#### 可能原因 4: URL 编码问题

**可能的问题：**
- Token 包含特殊字符（虽然 hex 不应该有）
- URL 传递过程中被截断或修改
- 邮件客户端修改了 URL

**验证方法：**
- 对比邮件中的 token 和日志中生成的 token
- 检查 URL 是否完整
- 尝试手动复制 token 进行测试

---

## 调试步骤

### 步骤 1: 查看订阅日志

在 Render Logs 中查找：
```
[INFO] Generated token for test@example.com: abc123...
[INFO] Confirmation URL: https://lizizai.xyz/api/subscribe/confirm?token=abc123...
[INFO] Confirmation email sent to test@example.com
```

**记录：**
- Token 值：`_________________`
- URL：`_________________`

---

### 步骤 2: 查看确认日志

在 Render Logs 中查找：
```
[INFO] Confirming subscription with token: abc123...
[INFO] Subscriber found: No
```

**如果显示 "No"，说明数据库中没有匹配的记录。**

---

### 步骤 3: 直接查询数据库

```sql
-- 查看最近的订阅者
SELECT 
  id, 
  email, 
  status, 
  confirmation_token, 
  confirmed_at,
  created_at
FROM subscribers 
ORDER BY created_at DESC 
LIMIT 5;
```

**检查：**
- ✅ `confirmation_token` 是否有值？
- ✅ `confirmation_token` 是否与邮件中的一致？
- ✅ `status` 是 `'pending'` 还是 `'active'`？
- ✅ `confirmed_at` 是否为 `NULL`？

---

### 步骤 4: 测试 API 直接调用

```bash
# 使用数据库中的实际 token
curl -v "https://lizizai-blog.onrender.com/api/subscribers/confirm?token=YOUR_ACTUAL_TOKEN"
```

**预期响应：**
- 成功：`{"message": "Subscription confirmed successfully!", "success": true}`
- 失败：`{"error": {"status": 404, "message": "Invalid confirmation token"}}`

---

## 临时解决方案

如果问题持续存在，可以考虑：

### 方案 1: 简化 Token 验证

```typescript
// 同时查询 email 和 token
const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
  where: {
    confirmationToken: token,
    status: 'pending',  // 只查询待确认的
  },
});
```

### 方案 2: 添加备用查询

```typescript
// 如果 token 查询失败，尝试查询最近的待确认订阅
if (!subscriber) {
  const recentPending = await strapi.db.query('api::subscriber.subscriber').findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    limit: 1,
  });
  
  strapi.log.warn('Token not found, recent pending:', recentPending);
}
```

### 方案 3: 使用 UUID 而不是随机 hex

```typescript
import { randomUUID } from 'crypto';

const confirmationToken = randomUUID(); // 生成标准 UUID
```

---

## 下一步行动

1. **部署日志版本**（已完成 ✅）
2. **使用新邮箱测试**
3. **收集日志信息**：
   - 订阅时的 token
   - 确认时的 token
   - 数据库查询结果
4. **对比 token 值**
5. **根据日志定位问题**

---

*文档生成时间：2025年11月3日*  
*版本：1.0*
