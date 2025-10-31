# Zeabur 部署指南

本指南将帮助您将 Strapi 后端部署到 Zeabur 平台。

---

## 为什么选择 Zeabur？

### Zeabur vs Render 对比

| 特性 | Zeabur | Render Free |
|------|--------|-------------|
| 休眠策略 | 更宽松（30分钟） | 严格（15分钟） |
| 启动速度 | 更快（10-20秒） | 较慢（30-60秒） |
| 中国访问 | 更快 | 较慢 |
| 免费额度 | 更慷慨 | 有限 |
| 部署速度 | 快 | 中等 |
| 文档质量 | 优秀（中文） | 优秀（英文） |

**推荐**: Zeabur 更适合中国用户，且免费计划更友好。

---

## 前置准备

### 1. 注册 Zeabur 账号
访问: https://zeabur.com

- 使用 GitHub 账号登录（推荐）
- 或使用邮箱注册

### 2. 准备数据库
您已经有 Supabase PostgreSQL 数据库，可以继续使用。

### 3. 准备代码
确保代码已推送到 GitHub: https://github.com/741311791/lizizai-blog

---

## 部署步骤

### 方式一：通过 Zeabur Dashboard（推荐）

#### 1. 创建新项目

1. 登录 Zeabur Dashboard: https://dash.zeabur.com
2. 点击 "Create Project"
3. 输入项目名称: `lizizai-blog`
4. 选择区域: `US West` 或 `Asia Pacific`

#### 2. 添加服务

1. 在项目中点击 "Add Service"
2. 选择 "Git Repository"
3. 连接 GitHub 账号（如果还没连接）
4. 选择仓库: `741311791/lizizai-blog`
5. 选择分支: `main`
6. 设置 Root Directory: `backend`

#### 3. 配置环境变量

在服务设置中添加以下环境变量：

```env
# 基础配置
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# 数据库配置（使用您的 Supabase 信息）
DATABASE_CLIENT=postgres
DATABASE_HOST=db.guucwbjysexvochrnhco.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=HPSRs7pl5NQ5m3bR
DATABASE_SSL=true

# Strapi 密钥（使用您现有的）
APP_KEYS=toBeModified1,toBeModified2
API_TOKEN_SALT=/IAb30Ao+pxpqi25Dg5+Bw==
ADMIN_JWT_SECRET=88noAMbZV1OAFv6LS6XwVQ==
TRANSFER_TOKEN_SALT=H3NxD3s1scIJJRScaiB+Fg==
JWT_SECRET=h1kQYx7NhkxUkxxJ5tm6gqOWB9K72EJdMhDlrxGY00wMIUAa/cyz9T1op9nuUIYfgRbZcd3ckr0lRw0UHmAkVQ==

# 前端 URL（部署后更新）
FRONTEND_URL=https://frontend-kdicg9ptg-louies-projects-dbfd71aa.vercel.app
```

#### 4. 部署

1. 点击 "Deploy"
2. 等待构建和部署完成（约 3-5 分钟）
3. 获取服务 URL（例如：`https://lizizai-blog-strapi.zeabur.app`）

#### 5. 验证部署

访问以下 URL 验证：

- 健康检查: `https://your-service.zeabur.app/_health`
- API: `https://your-service.zeabur.app/api`
- 管理面板: `https://your-service.zeabur.app/admin`

---

### 方式二：通过 Zeabur CLI

#### 1. 安装 Zeabur CLI

```bash
npm install -g @zeabur/cli
# 或
curl -fsSL https://zeabur.com/install.sh | bash
```

#### 2. 登录

```bash
zeabur auth login
```

#### 3. 初始化项目

```bash
cd /home/ubuntu/letters-clone/backend
zeabur init
```

#### 4. 部署

```bash
zeabur deploy
```

---

## 配置域名（可选）

### 1. 使用 Zeabur 提供的域名

Zeabur 会自动为您的服务分配一个域名：
- 格式: `https://your-service-name.zeabur.app`

### 2. 使用自定义域名

1. 在 Zeabur Dashboard 中选择服务
2. 进入 "Domains" 标签
3. 点击 "Add Domain"
4. 输入您的域名
5. 按照提示配置 DNS 记录

**DNS 配置示例**:
```
Type: CNAME
Name: api (或 @)
Value: cname.zeabur.app
```

---

## 更新前端配置

### 1. 更新环境变量

部署成功后，更新前端环境变量：

```bash
# 在 Vercel Dashboard 中更新
NEXT_PUBLIC_STRAPI_URL=https://your-service.zeabur.app
NEXT_PUBLIC_STRAPI_API_URL=https://your-service.zeabur.app/api
```

### 2. 更新 Strapi CORS

在 Zeabur Dashboard 中更新环境变量：

```env
FRONTEND_URL=https://frontend-kdicg9ptg-louies-projects-dbfd71aa.vercel.app
```

### 3. 重新部署前端

Vercel 会自动检测环境变量变化并重新部署。

---

## 监控和日志

### 查看日志

1. 在 Zeabur Dashboard 中选择服务
2. 点击 "Logs" 标签
3. 实时查看应用日志

### 监控指标

Zeabur 提供以下监控指标：
- CPU 使用率
- 内存使用率
- 网络流量
- 请求数量

---

## 故障排查

### 问题 1: 构建失败

**可能原因**:
- 依赖安装失败
- Dockerfile 配置错误

**解决方案**:
1. 检查 Dockerfile 语法
2. 查看构建日志
3. 确保 `pnpm-lock.yaml` 存在

### 问题 2: 数据库连接失败

**可能原因**:
- 数据库凭据错误
- SSL 配置问题

**解决方案**:
1. 验证环境变量
2. 检查 `config/database.ts`
3. 确保 `DATABASE_SSL=true`

### 问题 3: 服务无法访问

**可能原因**:
- 端口配置错误
- 健康检查失败

**解决方案**:
1. 确保 `PORT=1337`
2. 确保 `HOST=0.0.0.0`
3. 检查健康检查端点

### 问题 4: CORS 错误

**可能原因**:
- 前端 URL 未配置

**解决方案**:
1. 更新 `FRONTEND_URL` 环境变量
2. 检查 `config/middlewares.ts`
3. 重启服务

---

## 性能优化

### 1. 启用缓存

在 Strapi 中安装缓存插件：

```bash
pnpm add strapi-plugin-rest-cache
```

### 2. 配置 CDN

使用 Cloudflare 或其他 CDN 服务加速静态资源。

### 3. 数据库优化

- 添加索引
- 使用连接池
- 定期清理数据

---

## 成本估算

### Zeabur 免费计划

- **CPU**: 0.5 vCPU
- **内存**: 512 MB
- **存储**: 1 GB
- **流量**: 无限制
- **休眠**: 30 分钟不活动后休眠
- **成本**: $0/月

### Zeabur Developer 计划

- **CPU**: 1 vCPU
- **内存**: 1 GB
- **存储**: 5 GB
- **流量**: 无限制
- **休眠**: 无
- **成本**: $5/月

**推荐**: 对于生产环境，建议升级到 Developer 计划。

---

## 迁移清单

从 Render 迁移到 Zeabur：

- [ ] 在 Zeabur 创建项目
- [ ] 配置环境变量
- [ ] 部署服务
- [ ] 验证 API 正常工作
- [ ] 更新前端环境变量
- [ ] 测试前端集成
- [ ] 更新 DNS（如果使用自定义域名）
- [ ] 停止 Render 服务

---

## 备份和恢复

### 数据库备份

Supabase 自动备份数据库，您也可以手动备份：

```bash
# 使用 pg_dump
pg_dump postgres://postgres.guucwbjysexvochrnhco:HPSRs7pl5NQ5m3bR@aws-1-us-east-1.pooler.supabase.com:5432/postgres > backup.sql
```

### 恢复数据

```bash
# 使用 psql
psql postgres://... < backup.sql
```

---

## 安全建议

1. **定期更新密钥**: 定期轮换 JWT 密钥和 API Token
2. **限制 API 访问**: 配置 IP 白名单
3. **启用 HTTPS**: Zeabur 自动提供 SSL 证书
4. **监控日志**: 定期检查异常访问
5. **备份数据**: 定期备份数据库

---

## 常用命令

```bash
# 查看服务状态
zeabur service list

# 查看日志
zeabur logs -f

# 重启服务
zeabur service restart

# 查看环境变量
zeabur env list

# 设置环境变量
zeabur env set KEY=VALUE

# 删除环境变量
zeabur env unset KEY
```

---

## 支持资源

- **Zeabur 文档**: https://zeabur.com/docs
- **Zeabur Discord**: https://discord.gg/zeabur
- **Strapi 文档**: https://docs.strapi.io
- **GitHub Issues**: https://github.com/741311791/lizizai-blog/issues

---

## 总结

Zeabur 提供了比 Render 更好的免费计划和更快的访问速度，特别适合中国用户。通过本指南，您可以轻松将 Strapi 后端迁移到 Zeabur，享受更稳定的服务。

**下一步**:
1. 注册 Zeabur 账号
2. 按照步骤部署服务
3. 更新前端配置
4. 测试完整功能

祝部署顺利！🚀
