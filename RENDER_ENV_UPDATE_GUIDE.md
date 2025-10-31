# Render 环境变量更新指南

## 📋 需要更新的环境变量

### 数据库相关环境变量（必须更新）

| 环境变量名 | 新值 | 说明 |
| :--- | :--- | :--- |
| `DATABASE_HOST` | `db.niwxrwupesfeiukephhp.supabase.co` | 新数据库主机地址 |
| `DATABASE_NAME` | `postgres` | 数据库名称（保持不变） |
| `DATABASE_USERNAME` | `postgres.niwxrwupesfeiukephhp` | 新数据库用户名 |
| `DATABASE_PASSWORD` | `eJB5tQNIEFizOTq1` | 新数据库密码 |
| `DATABASE_PORT` | `5432` | 数据库端口（保持不变） |
| `DATABASE_SCHEMA` | `public` | 数据库 schema（保持不变） |
| `DATABASE_SSL` | `false` | SSL 配置（保持不变） |
| `DATABASE_CLIENT` | `postgres` | 数据库客户端（保持不变） |

### 完整的数据库 URL（可选，但推荐）

| 环境变量名 | 新值 |
| :--- | :--- |
| `DATABASE_URL` | `postgres://postgres.niwxrwupesfeiukephhp:eJB5tQNIEFizOTq1@aws-1-us-east-1.pooler.supabase.com:5432/postgres` |

### 其他环境变量（保持不变）

以下环境变量**不需要更新**，保持原值：

- `ADMIN_JWT_SECRET`
- `API_TOKEN_SALT`
- `APP_KEYS`
- `JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `HOST`
- `PORT`
- `NODE_ENV`
- `NODE_VERSION`

## 🔧 更新步骤

### 步骤 1：登录 Render Dashboard

访问：https://dashboard.render.com/

### 步骤 2：找到后端服务

1. 在 Dashboard 中找到 `lizizai-blog` 服务
2. 点击进入服务详情页

### 步骤 3：更新环境变量

1. 点击左侧菜单的 **"Environment"**
2. 找到以下环境变量并逐一更新：

#### 更新数据库主机
```
DATABASE_HOST = db.niwxrwupesfeiukephhp.supabase.co
```

#### 更新数据库用户名
```
DATABASE_USERNAME = postgres.niwxrwupesfeiukephhp
```

#### 更新数据库密码
```
DATABASE_PASSWORD = eJB5tQNIEFizOTq1
```

#### 更新数据库 URL（如果存在）
```
DATABASE_URL = postgres://postgres.niwxrwupesfeiukephhp:eJB5tQNIEFizOTq1@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### 步骤 4：保存并触发重新部署

1. 点击 **"Save Changes"**
2. Render 会自动触发重新部署
3. 等待部署完成（约 3-5 分钟）

### 步骤 5：验证部署

部署完成后：

1. 访问 Strapi 管理面板：https://lizizai-blog.onrender.com/admin
2. 使用管理员账号登录：
   - Email: `liancheng.ly@gmail.com`
   - Password: `rhMc^X2Gi5`
3. 检查是否能正常访问（应该会提示创建新内容，因为是新数据库）

## 📊 环境变量对比表

### 旧数据库 vs 新数据库

| 项目 | 旧值 | 新值 |
| :--- | :--- | :--- |
| **Host** | `db.guucwbjysexvochrnhco.supabase.co` | `db.niwxrwupesfeiukephhp.supabase.co` |
| **Username** | `postgres.guucwbjysexvochrnhco` | `postgres.niwxrwupesfeiukephhp` |
| **Password** | `HPSRs7pl5NQ5m3bR` | `eJB5tQNIEFizOTq1` |
| **Database** | `postgres` | `postgres` ✅ 相同 |
| **Port** | `5432` | `5432` ✅ 相同 |
| **Schema** | `public` | `public` ✅ 相同 |

## ⚠️ 注意事项

1. **更新环境变量后会自动触发重新部署**
   - 服务会短暂不可用（约 3-5 分钟）
   - 请在低流量时段操作

2. **新数据库是空的**
   - 部署后 Strapi 会自动创建表结构
   - 需要重新创建管理员账号（或使用现有账号）
   - 需要重新创建文章和其他内容

3. **旧数据库的数据不会自动迁移**
   - 如果需要保留旧数据，需要手动导出/导入
   - 但根据您的说法，旧数据不重要，可以忽略

4. **API Token 需要重新生成**
   - 旧的 API Token 在新数据库中无效
   - 部署后需要在 Strapi 中重新生成

## ✅ 完成检查清单

更新完成后，请确认：

- [ ] 所有 4 个数据库环境变量已更新
- [ ] Render 部署成功（无错误）
- [ ] Strapi 管理面板可以访问
- [ ] 可以创建新的文章内容
- [ ] API 能正常返回数据

---

**准备好后，请告诉我，我会协助您验证部署结果！**
