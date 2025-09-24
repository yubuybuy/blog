# Sanity后台管理指南

## 🔧 修复删除功能问题

如果你发现Sanity后台无法删除文章、分类或作者，请按以下步骤解决：

### 1. 检查API权限设置

前往 [Sanity管理面板](https://www.sanity.io/manage) → 选择你的项目 → Settings → API：

1. **检查Dataset配置**:
   - 确保使用的是 `development` 或具有写入权限的dataset
   - `production` dataset默认是只读的

2. **创建具有删除权限的Token**:
   - 点击 "Add API token"
   - 名称：`Blog Admin Token`
   - 权限：选择 `Editor` 或 `Admin`
   - 复制生成的token

3. **更新环境变量**:
   ```bash
   SANITY_API_TOKEN=your_admin_token_here
   ```

### 2. 检查Dataset设置

1. 在Sanity管理面板中，确保你的dataset允许删除操作
2. 如果使用 `production` dataset，考虑：
   - 切换到 `development` dataset
   - 或在 `production` dataset中启用写入权限

### 3. 本地开发设置

更新你的 `.env.local` 文件：

```bash
# Sanity配置
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=development  # 使用development数据集
SANITY_API_TOKEN=your_admin_token_here  # 具有admin权限的token

# TMDB配置
TMDB_API_KEY=your_tmdb_key

# AI服务配置
GEMINI_API_KEY=your_gemini_key
COHERE_API_KEY=your_cohere_key
```

### 4. 重启服务

配置更改后，重启本地开发服务器：

```bash
npm run dev
```

然后访问 `http://localhost:3000/admin` 检查删除功能是否可用。

### 5. 验证删除功能

在Sanity后台中，你应该能看到：
- 🗑️ 删除此项 按钮（红色）
- ✅ 发布 按钮
- 📝 取消发布 按钮
- 📋 复制 按钮

## 🚀 快速操作指南

后台现在包含以下增强功能：

### 快速操作区域
- 📝 新建文章
- 🗂️ 新建分类
- 👤 新建作者

### 内容管理区域
- 📄 博客文章管理
- 🏷️ 分类管理
- 👥 作者管理
- ⚙️ 网站设置

## 🛠️ 故障排除

### 问题1：删除按钮仍然不可见
**解决方案**：
1. 清除浏览器缓存
2. 确认API token具有admin权限
3. 检查dataset是否允许写入操作

### 问题2：删除操作失败
**解决方案**：
1. 检查网络连接
2. 确认token没有过期
3. 检查是否有其他文档引用了要删除的项目

### 问题3：权限错误
**解决方案**：
1. 重新生成API token
2. 确认token权限设置为"Editor"或"Admin"
3. 更新环境变量并重启服务

## 📞 需要帮助？

如果问题仍然存在，请检查：
1. Sanity项目设置
2. API token权限
3. Environment variables配置
4. Dataset权限设置

---

**注意**：为了安全起见，建议在生产环境中使用更严格的权限控制。