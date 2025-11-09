# 后端 API 测试文档

## 概述

本测试套件覆盖后端所有对外暴露的公共 API 接口,使用 Jest 和 Supertest 进行集成测试。

## 测试覆盖

### 1. Subscriber API (13 个测试)

**订阅功能 (POST /api/subscribers/subscribe)**
- ✅ 创建新订阅 (有效邮箱)
- ✅ 拒绝无效的邮箱地址
- ✅ 拒绝缺少邮箱的请求
- ✅ 处理重复订阅

**取消订阅功能 (POST /api/subscribers/unsubscribe)**
- ✅ 拒绝无效的邮箱地址
- ✅ 处理不存在的邮箱
- ✅ 拒绝缺少邮箱的请求

**订阅者统计 (GET /api/subscribers/count)**
- ✅ 返回订阅者数量

**订阅确认 (GET /api/subscribe/confirm)**
- ✅ 拒绝缺少 token 的请求
- ✅ 拒绝无效的 token
- ✅ 拒绝过期的 token

**集成测试**
- ✅ 完整订阅流程: 订阅 -> 计数增加

### 2. Article API (7 个测试)

**文章点赞功能 (POST /api/articles/:id/like)**
- ✅ 拒绝无效的文章ID (非数字)
- ✅ 拒绝不存在的文章ID
- ✅ 拒绝缺少 visitorId 的请求
- ✅ 接受任意长度的 visitorId

**边界测试**
- ✅ 处理极大的文章ID
- ✅ 处理极长的 visitorId
- ✅ 处理特殊字符的 visitorId

### 3. Health API (3 个测试)

**健康检查 (GET /api/health/_health)**
- ✅ 返回健康状态
- ✅ 快速响应 (< 5秒)
- ✅ 不需要认证

## 运行测试

### 前置条件

1. **确保后端服务器正在运行**
   ```bash
   pnpm develop
   ```
   服务器应在 `http://localhost:10000` 监听

2. **数据库连接正常**
   确保 PostgreSQL 数据库已启动并正确配置

### 测试命令

```bash
# 运行所有测试
pnpm test

# 监听模式 (开发时使用)
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# CI/CD 模式
pnpm test:ci
```

### 测试结果

```
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        ~20s
```

## 测试结构

```
tests/
├── README.md                    # 本文档
├── setup/
│   ├── global-setup.ts         # 全局测试环境初始化
│   └── global-teardown.ts      # 全局测试环境清理
├── helpers/
│   └── api-client.ts           # API 客户端工具类
└── api/
    ├── subscriber.test.ts      # 订阅者 API 测试
    ├── article.test.ts         # 文章 API 测试
    └── health.test.ts          # 健康检查 API 测试
```

## API 客户端工具

`tests/helpers/api-client.ts` 提供了便捷的 HTTP 请求方法:

```typescript
// GET 请求
await apiClient.get('/api/subscribers/count', { param: 'value' });

// POST 请求
await apiClient.post('/api/subscribers/subscribe', { email: 'test@test.com' });

// PUT 请求
await apiClient.put('/api/path', { data: 'value' });

// DELETE 请求
await apiClient.delete('/api/path');

// 工具方法
apiClient.generateRandomEmail();      // 生成随机邮箱
apiClient.generateRandomString(10);   // 生成随机字符串
await apiClient.wait(1000);           // 等待指定时间
```

## 测试配置

测试配置在 `jest.config.ts` 中定义:

- **测试环境**: Node.js
- **测试超时**: 30 秒
- **覆盖率目录**: `coverage/`
- **测试文件模式**: `**/*.test.ts`

## 注意事项

1. **集成测试**: 所有测试都是针对实际运行的后端服务器进行的集成测试
2. **数据隔离**: 每个测试使用随机生成的数据以避免冲突
3. **测试顺序**: 测试之间应该是独立的,不依赖执行顺序
4. **服务器依赖**: 运行测试前必须确保后端服务器已启动

## 故障排查

### 测试失败: AggregateError

**原因**: 后端服务器未运行或正在重启

**解决方案**:
1. 确认后端服务器正在运行: `pnpm develop`
2. 等待服务器完全启动 (看到 "Strapi started successfully")
3. 重新运行测试

### 测试超时

**原因**: 数据库连接问题或服务器响应慢

**解决方案**:
1. 检查数据库连接状态
2. 增加测试超时时间 (在 `jest.config.ts` 中)
3. 检查服务器日志排查性能问题

## 测试原则

- **KISS**: 测试代码简洁明了
- **DRY**: 使用 API 客户端工具类复用代码
- **覆盖率**: 仅覆盖公开的 API 接口
- **独立性**: 每个测试独立运行,互不影响
