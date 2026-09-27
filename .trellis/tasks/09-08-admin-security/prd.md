# Admin 后台安全与体验修复

**优先级**:P0 | **父任务**:09-08-frontend-audit | **页面**:`/admin`、`/api/admin/auth`、`/api/admin/sync`

## 修复清单

### HIGH(安全)

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 1 | `app/api/admin/auth/route.ts:24-29` + `app/api/admin/sync/route.ts:61` | 会话可伪造:登录成功后 cookie 值写死字面量 `'true'` 且未签名,GET 校验仅 `session === 'true'`;任何人都可 `curl -H "Cookie: admin_session=true" /api/admin/sync` 绕过密码触发同步(内部还会登录评论系统并 revalidatePath 全站) | 服务端签发随机 token(HMAC 签名 + 过期时间)存 httpOnly cookie;GET/sync 校验 token 匹配而非字面量 |
| 2 | `app/admin/page.tsx:59` | 登出完全失效:`document.cookie = 'admin_session=; max-age=0'` 无法删除 httpOnly cookie,刷新后仍 authenticated:true,用户以为已退出实则会话仍在 | 后端增加 `DELETE /api/admin/auth`(response.cookies.delete),前端调用成功后再 reset state |

### MEDIUM

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 3 | `app/api/admin/auth/route.ts:13-21` | 登录可暴力破解:无 IP 限流、无锁定、非常数时间比较 | 加限流(如 5 次/分/IP,Vercel WAF 或内存计数);改 `crypto.timingSafeEqual` |
| 4 | `app/admin/layout.tsx:3-13` + `app/robots.ts` | admin 页无 noindex,`robots.ts` 仅 disallow `/api/`,`/admin` 会被搜索引擎收录 | layout 导出 `metadata = { robots: { index: false, follow: false } }`;robots.ts 一并 disallow `/admin` |
| 5 | `app/admin/page.tsx:107-113` | 密码框无 label、无 `autoComplete="current-password"`;`password.trim()` 会静默丢弃首尾含空格的合法密码 | 加 sr-only label + autoComplete;去掉 trim |
| 6 | `app/admin/page.tsx:43,70` | 服务端返回 502 HTML 时 `res.json()` 抛异常,登录/同步统一误报「网络错误,请重试」 | json 解析单独 try/catch,兜底文案「服务暂时不可用」 |

### LOW

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| 7 | `app/admin/page.tsx:120-122` | 登录「验证中...」纯文字无 spinner,与同步按钮(RefreshCw animate-spin)不一致 | 加 `<Loader2 className="animate-spin" />` |
| 8 | `app/admin/page.tsx:169-184` | 同步结果直插无过渡、读屏无感知 | 容器加 `role="status" aria-live="polite"`;入场动效按规范值(opacity 0→1 / scale 0.25→1 / blur 4px→0,0.3s) |
| 9 | `app/admin/page.tsx:107-113` | 密码输入框与按钮命中区 36px(< 40px) | Input h-11、按钮 `size="lg"` |

## 验收标准

- [x] 无 cookie / 伪造 cookie(`admin_session=true`)访问 `/api/admin/sync` 均返回 401(用 curl 验证)
- [x] 正确密码登录 → 同步 → 登出 → 刷新后确认已登出(注:本地 dev 上游同步服务返回 404,属外部服务地址问题;授权链路已验证 — 有效签名会话通过认证层,登出后 401)
- [x] `/admin` 响应头/HTML 含 noindex;robots.txt 含 `/admin`
- [x] 错误密码连续输错触发限流提示(第 6 次返回 429 + 「尝试过于频繁」提示)
- [x] `pnpm lint`、`pnpm build` 通过;admin 页截图验证(登录态/错误态/同步结果态)(build webpack 593/593 通过;lint 改动文件零新增问题 — `workers/` 目录 82 个 error 为基线遗留,与本任务无关;截图:桌面+移动登录态、面板态、同步结果态均正常)
