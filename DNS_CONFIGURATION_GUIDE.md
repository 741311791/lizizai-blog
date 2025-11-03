# DNS 配置指南 - Resend 邮件域名验证

**域名：** lizizai.xyz  
**目的：** 验证域名以便使用自定义邮箱地址发送邮件  
**当前状态：** 使用临时测试域名 `onboarding@resend.dev`

---

## 当前问题

Resend 域名验证失败，需要添加以下 DNS 记录：

| 记录类型 | 状态 | 说明 |
|---------|------|------|
| DKIM (TXT) | ✅ 已验证 | 域名身份验证 |
| MX | ❌ 失败 | 邮件接收服务器 |
| SPF (TXT) | ❌ 失败 | 发件人策略框架 |
| DMARC (TXT) | ⚠️ 可选 | 邮件认证报告 |

---

## 需要添加的 DNS 记录

### 1. MX 记录（必需）

**用途：** 指定邮件接收服务器

| 字段 | 值 |
|------|---|
| **Type** | MX |
| **Name** | `send` |
| **Content/Value** | `feedback-smtp.us-east-1.amazonses.com` |
| **Priority** | `10` |
| **TTL** | Auto 或 3600 |

**完整记录：**
```
send.lizizai.xyz  MX  10  feedback-smtp.us-east-1.amazonses.com
```

### 2. SPF 记录（必需）

**用途：** 授权 Amazon SES 代表您的域名发送邮件

| 字段 | 值 |
|------|---|
| **Type** | TXT |
| **Name** | `send` |
| **Content/Value** | `v=spf1 include:amazonses.com ~all` |
| **TTL** | Auto 或 3600 |

**完整记录：**
```
send.lizizai.xyz  TXT  "v=spf1 include:amazonses.com ~all"
```

### 3. DMARC 记录（可选，但推荐）

**用途：** 指定如何处理未通过验证的邮件

| 字段 | 值 |
|------|---|
| **Type** | TXT |
| **Name** | `_dmarc` |
| **Content/Value** | `v=DMARC1; p=none;` |
| **TTL** | Auto 或 3600 |

**完整记录：**
```
_dmarc.lizizai.xyz  TXT  "v=DMARC1; p=none;"
```

---

## 配置步骤

### 步骤 1: 登录域名提供商

常见的域名提供商：
- **Cloudflare** - https://dash.cloudflare.com
- **Namecheap** - https://www.namecheap.com
- **GoDaddy** - https://www.godaddy.com
- **阿里云** - https://dns.console.aliyun.com
- **腾讯云** - https://console.cloud.tencent.com/cns

### 步骤 2: 进入 DNS 管理

1. 找到 `lizizai.xyz` 域名
2. 点击"DNS 管理"或"DNS 设置"
3. 进入 DNS 记录编辑页面

### 步骤 3: 添加 MX 记录

**Cloudflare 示例：**
1. 点击"Add record"
2. Type: 选择 `MX`
3. Name: 输入 `send`
4. Mail server: 输入 `feedback-smtp.us-east-1.amazonses.com`
5. Priority: 输入 `10`
6. TTL: 选择 `Auto`
7. 点击"Save"

**其他提供商：**
- 字段名称可能略有不同（如 "Value" vs "Mail server"）
- 确保 Priority/优先级设置为 `10`
- 如果有 "Proxy status"，设置为 "DNS only"（不代理）

### 步骤 4: 添加 SPF 记录

**Cloudflare 示例：**
1. 点击"Add record"
2. Type: 选择 `TXT`
3. Name: 输入 `send`
4. Content: 输入 `v=spf1 include:amazonses.com ~all`
5. TTL: 选择 `Auto`
6. 点击"Save"

**注意事项：**
- Content 值必须用引号括起来（某些提供商会自动添加）
- 不要添加额外的空格或换行
- `~all` 表示软失败（推荐），也可以使用 `-all`（硬失败）

### 步骤 5: 添加 DMARC 记录（可选）

**Cloudflare 示例：**
1. 点击"Add record"
2. Type: 选择 `TXT`
3. Name: 输入 `_dmarc`
4. Content: 输入 `v=DMARC1; p=none;`
5. TTL: 选择 `Auto`
6. 点击"Save"

### 步骤 6: 验证配置

**使用命令行验证：**

```bash
# 验证 MX 记录
dig MX send.lizizai.xyz

# 验证 SPF 记录
dig TXT send.lizizai.xyz

# 验证 DMARC 记录
dig TXT _dmarc.lizizai.xyz
```

**使用在线工具验证：**
- MXToolbox: https://mxtoolbox.com/SuperTool.aspx
- DNS Checker: https://dnschecker.org

### 步骤 7: 等待 DNS 传播

DNS 记录更新需要时间传播到全球：
- **最快：** 5-15 分钟
- **通常：** 1-2 小时
- **最长：** 24-48 小时

**检查传播状态：**
- https://www.whatsmydns.net

### 步骤 8: 在 Resend 中重新验证

1. 访问 https://resend.com/domains
2. 找到 `lizizai.xyz` 域名
3. 点击"Restart"或"Verify"按钮
4. 等待验证完成

---

## 验证成功后的操作

### 1. 更新环境变量

在 Render Dashboard 中更新 `EMAIL_FROM` 环境变量：

```
EMAIL_FROM=future/proof <newsletter@lizizai.xyz>
```

或者保持当前配置，让代码使用默认值。

### 2. 更新代码（可选）

如果希望使用自定义域名，修改 `backend/src/api/subscriber/services/resend-service.ts`：

```typescript
// 从
from: process.env.EMAIL_FROM || 'Onboarding <onboarding@resend.dev>',

// 改为
from: process.env.EMAIL_FROM || 'future/proof <newsletter@lizizai.xyz>',
```

### 3. 重新部署

```bash
git add -A
git commit -m "chore: 切换到自定义邮件域名"
git push origin main
```

### 4. 测试邮件发送

使用真实邮箱测试订阅功能：
1. 访问 https://lizizai.xyz/subscribe
2. 填写邮箱并提交
3. 检查邮箱是否收到确认邮件
4. 验证发件人显示为 `future/proof <newsletter@lizizai.xyz>`

---

## 常见问题

### Q1: DNS 记录添加后仍然验证失败？

**A:** 等待 DNS 传播完成（最长 48 小时）。使用 `dig` 命令或在线工具检查记录是否生效。

### Q2: 是否需要添加所有记录？

**A:** 
- **必需：** MX 和 SPF 记录
- **推荐：** DMARC 记录（提高邮件送达率）
- **已完成：** DKIM 记录（Resend 显示已验证）

### Q3: Priority 应该设置为多少？

**A:** MX 记录的 Priority 必须设置为 `10`。这是 Resend 要求的标准值。

### Q4: 如果域名在 Cloudflare 上，需要关闭代理吗？

**A:** 
- MX 记录：**必须**设置为 "DNS only"（不能代理）
- TXT 记录：可以代理或不代理（推荐 "DNS only"）

### Q5: 可以使用根域名发送邮件吗？

**A:** 可以，但 Resend 推荐使用子域名（如 `send`）：
- **优点：** 不影响主域名的邮件信誉
- **优点：** 更容易管理和隔离
- **优点：** 符合最佳实践

### Q6: 测试域名有什么限制？

**A:** 
- ✅ 可以正常发送邮件
- ✅ 适合开发和测试
- ❌ 发件人显示为 "Onboarding"
- ❌ 可能被某些邮件服务商标记为垃圾邮件
- ❌ 不适合生产环境长期使用

---

## 配置检查清单

在 Resend 域名验证之前，请确认：

- [ ] 已添加 MX 记录（Name: `send`, Priority: `10`）
- [ ] 已添加 SPF 记录（Name: `send`, Content: `v=spf1 include:amazonses.com ~all`）
- [ ] 已添加 DMARC 记录（可选）
- [ ] DNS 记录已传播（使用 dig 或在线工具验证）
- [ ] 在 Resend 中点击"Restart"重新验证
- [ ] 验证状态显示为"Verified"

---

## 参考资源

- **Resend 文档：** https://resend.com/docs/dashboard/domains/introduction
- **SPF 记录说明：** https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/
- **DMARC 记录说明：** https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/
- **DNS 传播检查：** https://www.whatsmydns.net
- **MX 记录检查：** https://mxtoolbox.com

---

## 技术支持

如果遇到问题，可以：
1. 查看 Resend 文档：https://resend.com/docs
2. 联系 Resend 支持：https://resend.com/support
3. 检查域名提供商的 DNS 配置文档

---

*DNS 配置指南生成时间：2025年11月3日*  
*文档版本：1.0*
