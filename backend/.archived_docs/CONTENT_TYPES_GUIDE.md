# Strapi 内容类型配置指南

本指南将帮助您在 Strapi 管理面板中创建所需的内容类型（Content Types）。

访问您的 Strapi 管理面板：https://lizizai-blog.onrender.com/admin

---

## 1. Category（分类）

### 创建步骤
1. 进入 Content-Type Builder
2. 点击 "Create new collection type"
3. Display name: `Category`
4. 点击 "Continue"

### 字段配置

| 字段名 | 类型 | 配置 |
|--------|------|------|
| name | Text | Required, Unique |
| slug | UID | Attached to: name, Required |
| description | Text (Long text) | - |

### 关系配置
- **articles**: Relation to Article (One Category has many Articles)

### 高级设置
- Draft & Publish: 启用

---

## 2. Author（作者）

### 创建步骤
1. Content-Type Builder → Create new collection type
2. Display name: `Author`

### 字段配置

| 字段名 | 类型 | 配置 |
|--------|------|------|
| name | Text | Required |
| slug | UID | Attached to: name |
| bio | Text (Long text) | - |
| avatar | Media (Single media) | - |
| email | Email | - |
| website | Text | - |
| twitter | Text | - |
| github | Text | - |

### 关系配置
- **articles**: Relation to Article (One Author has many Articles)

### 高级设置
- Draft & Publish: 启用

---

## 3. Tag（标签）

### 创建步骤
1. Content-Type Builder → Create new collection type
2. Display name: `Tag`

### 字段配置

| 字段名 | 类型 | 配置 |
|--------|------|------|
| name | Text | Required, Unique |
| slug | UID | Attached to: name, Required |

### 关系配置
- **articles**: Relation to Article (Many Tags belong to many Articles)

### 高级设置
- Draft & Publish: 启用

---

## 4. Article（文章）

### 创建步骤
1. Content-Type Builder → Create new collection type
2. Display name: `Article`

### 字段配置

| 字段名 | 类型 | 配置 |
|--------|------|------|
| title | Text | Required |
| slug | UID | Attached to: title, Required |
| subtitle | Text | - |
| content | Rich text | Required |
| excerpt | Text (Long text) | - |
| featuredImage | Media (Single media) | - |
| publishedAt | DateTime | - |
| likes | Number (Integer) | Default: 0 |
| views | Number (Integer) | Default: 0 |
| readingTime | Number (Integer) | 阅读时长（分钟） |

### 关系配置
- **author**: Relation to Author (Many Articles belong to one Author)
- **category**: Relation to Category (Many Articles belong to one Category)
- **tags**: Relation to Tag (Many Articles belong to many Tags)
- **comments**: Relation to Comment (One Article has many Comments)

### 高级设置
- Draft & Publish: 启用

---

## 5. Comment（评论）

### 创建步骤
1. Content-Type Builder → Create new collection type
2. Display name: `Comment`

### 字段配置

| 字段名 | 类型 | 配置 |
|--------|------|------|
| content | Text (Long text) | Required |
| authorName | Text | Required |
| authorEmail | Email | Required |
| authorAvatar | Text | URL to avatar |
| likes | Number (Integer) | Default: 0 |
| isApproved | Boolean | Default: false |

### 关系配置
- **article**: Relation to Article (Many Comments belong to one Article)
- **parentComment**: Relation to Comment (Many Comments belong to one Comment) - 用于嵌套回复
- **replies**: Relation to Comment (One Comment has many Comments)

### 高级设置
- Draft & Publish: 禁用（评论不需要草稿功能）

---

## 配置权限（Settings → Roles → Public）

为了让前端能够访问 API，需要配置公开权限：

### Article
- ✅ find
- ✅ findOne
- ✅ count

### Category
- ✅ find
- ✅ findOne

### Author
- ✅ find
- ✅ findOne

### Tag
- ✅ find
- ✅ findOne

### Comment
- ✅ find
- ✅ findOne
- ✅ create（允许用户创建评论）

---

## 创建示例数据

### 1. 创建作者
1. Content Manager → Author → Create new entry
2. 填写信息：
   - Name: DAN KOE
   - Bio: 作者简介
   - 上传头像

### 2. 创建分类
创建以下分类：
- Featured
- Lifestyle
- AI & Prompts
- Marketing Strategies
- HUMAN 3.0

### 3. 创建标签
创建一些常用标签：
- AI
- Productivity
- Business
- Personal Growth
- Technology

### 4. 创建文章
1. Content Manager → Article → Create new entry
2. 填写信息：
   - Title: You have about 36 months to make it
   - Subtitle: why everyone is racing to get rich
   - Content: 文章内容（可以使用 Markdown）
   - 选择 Author
   - 选择 Category
   - 选择 Tags
   - 上传 Featured Image
   - 设置 Published At
3. 点击 "Save" 然后 "Publish"

重复以上步骤创建更多文章。

---

## API 端点测试

创建内容后，可以通过以下端点测试：

```bash
# 获取所有文章
https://lizizai-blog.onrender.com/api/articles?populate=*

# 获取单篇文章
https://lizizai-blog.onrender.com/api/articles?filters[slug][$eq]=your-article-slug&populate=*

# 获取所有分类
https://lizizai-blog.onrender.com/api/categories?populate=*

# 获取分类下的文章
https://lizizai-blog.onrender.com/api/articles?filters[category][slug][$eq]=featured&populate=*
```

---

## 注意事项

1. **Populate 参数**：默认情况下，Strapi 不会返回关联数据，需要使用 `?populate=*` 来获取所有关联数据。

2. **图片 URL**：上传的图片 URL 格式为：`https://lizizai-blog.onrender.com/uploads/filename.jpg`

3. **Draft & Publish**：只有发布（Published）的内容才能通过 API 访问。

4. **权限配置**：确保在 Settings → Roles → Public 中配置了正确的权限。

5. **CORS**：已在 `config/middlewares.ts` 中配置，允许前端域名访问。

---

## 下一步

完成内容类型创建和示例数据后：
1. 测试 API 端点
2. 更新前端代码连接 Strapi API
3. 部署前端更新
4. 验证前后端集成
