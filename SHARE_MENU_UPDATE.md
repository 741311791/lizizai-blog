# 分享菜单更新说明

## 更新内容

根据你的设计要求，我已经将分享功能从**底部抽屉（Sheet/Drawer）**改为**下拉菜单（Dropdown Menu）**，现在分享菜单会在点击分享按钮时，在按钮附近弹出，体验更加流畅自然。

---

## ✅ 已完成的更改

### 1. 创建新的 ShareMenu 组件
**文件**: `frontend/components/share/ShareMenu.tsx`

使用 Radix UI Dropdown Menu 实现，包含以下分享选项：
- 📋 Copy link - 复制链接
- 📤 Send as message - 使用系统原生分享 API
- 🔗 Embed - 复制嵌入代码
- 📝 Share to Notes - 分享到备忘录
- 📘 Share to Facebook
- 💼 Share to Linkedin
- 🦋 Share to Bluesky
- 🐦 Share to X (Twitter)

### 2. 更新全局分享按钮
**文件**: `frontend/components/layout/Header.tsx`

- 移除了 Sheet/Drawer 相关代码
- 使用 ShareMenu 包裹分享按钮
- 点击后在按钮附近弹出下拉菜单

### 3. 更新文章卡片分享按钮
**文件**: `frontend/components/article/ArticleCard.tsx`

- 移除了 ShareDrawer 组件
- 使用 ShareMenu 包裹分享按钮
- 保持了分享计数功能

### 4. 清理旧文件
- ✅ 删除了 `ShareDrawer.tsx`
- 保留了 `Sheet.tsx`（可能其他地方会用到）

---

## 🎨 UI/UX 改进

### 旧设计（Sheet/Drawer）
- 从底部滑上来的抽屉
- 占据较大屏幕空间
- 需要点击遮罩或关闭按钮才能关闭

### 新设计（Dropdown Menu）
- 在点击位置附近弹出
- 占据空间小，更轻量
- 点击外部自动关闭
- 符合常见的分享菜单交互模式

---

## 🔧 技术实现

### 组件结构
```tsx
<ShareMenu
  title="标题"
  description="描述"
  url="https://..."
  onShare={() => {}}
>
  <Button>分享按钮</Button>
</ShareMenu>
```

### 菜单位置
- 默认对齐方式：`align="end"`（右对齐）
- 自动根据可用空间调整位置
- 确保菜单始终在视口内

### Toast 提示
- 复制成功：显示成功提示
- 复制失败：显示错误提示
- 使用 Sonner 提供流畅的提示体验

---

## 📱 响应式设计

菜单会根据屏幕大小自动调整：
- 移动端：菜单宽度适应屏幕
- 桌面端：固定宽度（14rem / 224px）
- 自动避免超出视口边界

---

## 🧪 测试验证

✅ 项目构建成功，无错误
✅ TypeScript 类型检查通过
✅ 所有分享选项功能正常

---

## 🚀 如何测试

1. 启动开发服务器：
```bash
cd frontend
pnpm run dev
```

2. 测试场景：
   - 点击 Header 右上角的分享按钮
   - 悬停文章卡片，点击分享按钮
   - 验证菜单在点击位置附近弹出
   - 测试各个分享选项：
     - 复制链接
     - 分享到社交媒体
     - 复制嵌入代码
   - 检查 toast 提示是否正常显示

---

## 📊 对比表

| 特性 | 旧设计 (Sheet) | 新设计 (Dropdown Menu) |
|------|---------------|----------------------|
| UI 位置 | 底部滑入 | 点击位置附近 |
| 占用空间 | 较大 | 较小 |
| 关闭方式 | 点击遮罩/关闭按钮 | 自动关闭 |
| 性能 | Portal 渲染 | Portal 渲染 |
| 响应式 | 固定高度 | 自适应 |
| 符合习惯 | 移动端常见 | 桌面端常见 |

---

## 🎯 符合的设计模式

新的下拉菜单设计符合：
- ✅ 常见社交平台的分享菜单模式（如你提供的截图）
- ✅ 桌面应用的上下文菜单交互
- ✅ 轻量级操作的最佳实践
- ✅ 减少用户操作步骤

---

## 📝 代码示例

### Header 中的用法
```tsx
<ShareMenu
  title="Zizai Blog"
  description="欢迎来到 Zizai Blog，分享技术与生活"
  url={`${config.siteUrl}${pathname}`}
>
  <Button variant="ghost" size="icon" aria-label="Share">
    <Share2 className="h-5 w-5" />
  </Button>
</ShareMenu>
```

### ArticleCard 中的用法
```tsx
<ShareMenu
  title={title}
  description={subtitle}
  url={`${config.siteUrl}/article/${slug}`}
  onShare={() => setShares(prev => prev + 1)}
>
  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
    <Share2 className="h-3.5 w-3.5" />
    <span>{shares}</span>
  </Button>
</ShareMenu>
```

---

## 🎨 自定义样式

如需调整菜单样式，可以修改 `ShareMenu.tsx` 中的：

```tsx
<DropdownMenuContent
  align="end"           // 对齐方式：start, center, end
  className="w-56"      // 菜单宽度
>
```

---

## 📦 依赖项

无需额外安装依赖，使用现有的：
- `@radix-ui/react-dropdown-menu`（已在 shadcn/ui 中包含）
- `sonner`（已安装）
- `lucide-react`（已安装）

---

生成时间: 2025-11-09
版本: v2.0 (Dropdown Menu)
