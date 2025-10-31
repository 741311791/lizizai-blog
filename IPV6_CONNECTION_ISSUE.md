# IPv6 数据库连接问题诊断

生成时间：2025-10-31

## 🚨 问题现象

```
Error: connect ENETUNREACH 2600:1f18:2e13:9d28:eb9c:b29e:df29:5188:5432
```

**错误分析：**
- `ENETUNREACH` = Network is unreachable（网络不可达）
- `2600:1f18:...` = IPv6 地址
- Render 尝试使用 IPv6 连接 Supabase，但失败

## 🔍 根本原因

Supabase 的 **Direct 连接（db.xxx.supabase.co:5432）** 可能不支持 IPv6，或者 Render 的 IPv6 网络无法访问 Supabase 的 IPv6 地址。

## 🔧 解决方案

### **方案 A：切换到 Pooler 连接（推荐）**

Supabase 的 Pooler 连接通常对 IPv6 支持更好。

**需要在 Render 上更新的环境变量：**

```bash
DATABASE_HOST=aws-1-us-east-1.pooler.supabase.com
DATABASE_PORT=6543
DATABASE_URL=postgres://postgres.niwxrwupesfeiukephhp:eJB5tQNIEFizOTq1@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

其他保持不变：
- `DATABASE_USERNAME=postgres.niwxrwupesfeiukephhp`
- `DATABASE_PASSWORD=eJB5tQNIEFizOTq1`
- `DATABASE_NAME=postgres`

### **方案 B：在 DATABASE_URL 中添加 IPv4 强制参数**

修改 `DATABASE_URL`，添加 `?family=4` 参数强制使用 IPv4：

```bash
DATABASE_URL=postgres://postgres.niwxrwupesfeiukephhp:eJB5tQNIEFizOTq1@db.niwxrwupesfeiukephhp.supabase.co:5432/postgres?family=4
```

### **方案 C：使用 IP 地址而不是域名**

1. 先解析 `db.niwxrwupesfeiukephhp.supabase.co` 的 IPv4 地址
2. 在 `DATABASE_URL` 中直接使用 IP 地址

但这个方案不推荐，因为 IP 可能会变化。

## 🎯 推荐操作

**立即执行方案 A - 切换到 Pooler 连接**

1. 登录 Render Dashboard
2. 找到 `lizizai-blog` 后端服务
3. Environment 标签
4. 更新以下 3 个环境变量：
   - `DATABASE_HOST` → `aws-1-us-east-1.pooler.supabase.com`
   - `DATABASE_PORT` → `6543`
   - `DATABASE_URL` → `postgres://postgres.niwxrwupesfeiukephhp:eJB5tQNIEFizOTq1@aws-1-us-east-1.pooler.supabase.com:6543/postgres`
5. Save Changes
6. 等待自动重新部署

## 📊 Pooler vs Direct 对比

| 特性 | Pooler (6543) | Direct (5432) |
| :--- | :--- | :--- |
| **连接池** | ✅ 支持 | ❌ 不支持 |
| **IPv6 支持** | ✅ 更好 | ⚠️ 可能不支持 |
| **并发连接** | ✅ 高 | ⚠️ 有限 |
| **适用场景** | 生产环境 | 开发环境 |
| **延迟** | 稍高（经过 pooler） | 更低（直连） |

**结论：对于生产环境（Render），Pooler 是更好的选择。**

---

**请立即执行方案 A，更新完成后告诉我！**
