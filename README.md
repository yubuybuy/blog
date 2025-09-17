# 个人博客网站

一个基于 Next.js 14 和 Sanity CMS 构建的现代化个人博客网站，支持富文本编辑、文章分类、搜索功能，并针对 SEO 进行了优化。

## 🚀 功能特性

- **现代化设计**：简洁美观的响应式设计
- **富文本编辑**：支持加粗、斜体、下划线、图片插入等格式
- **内容管理**：基于 Sanity CMS 的强大后台管理系统
- **文章分类**：支持自定义分类，方便内容组织
- **搜索功能**：全站搜索，快速找到需要的内容
- **SEO 优化**：完整的元数据配置、sitemap、robots.txt
- **移动端适配**：完美支持各种设备尺寸

## 🛠️ 技术栈

- **前端框架**：Next.js 14 (App Router)
- **样式方案**：Tailwind CSS
- **内容管理**：Sanity CMS
- **部署平台**：Vercel
- **语言**：TypeScript

## 📋 部署前准备

### 1. Sanity 项目设置

1. 访问 [Sanity.io](https://www.sanity.io/) 注册账号
2. 创建新项目：
   ```bash
   npm install -g @sanity/cli
   sanity init
   ```
3. 记录项目 ID 和数据集名称

### 2. 环境变量配置

复制 `.env.local.example` 为 `.env.local` 并填写以下变量：

```env
# Sanity 配置
NEXT_PUBLIC_SANITY_PROJECT_ID=你的项目ID
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=你的API令牌

# 网站配置
NEXT_PUBLIC_BASE_URL=https://你的域名.com
```

## 🚀 Vercel 部署步骤

### 方法一：GitHub 连接部署（推荐）

1. **准备代码仓库**
   ```bash
   # 初始化 Git 仓库
   git init
   git add .
   git commit -m "Initial commit"

   # 推送到 GitHub
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

2. **Vercel 部署**
   - 访问 [Vercel](https://vercel.com) 并登录
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 配置环境变量（在 Settings > Environment Variables）
   - 点击 "Deploy"

### 方法二：Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录并部署**
   ```bash
   vercel login
   vercel
   ```

## 🌐 域名配置

### 在 Vercel 中配置自定义域名

1. 进入项目的 Vercel 控制台
2. 前往 "Settings" > "Domains"
3. 添加你的域名
4. 按照指引配置 DNS 记录：
   - **A 记录**：指向 `76.76.19.61`
   - **CNAME 记录**：指向 `cname.vercel-dns.com`

### 常见 DNS 配置示例

**Cloudflare：**
- Type: A, Name: @, Content: 76.76.19.61
- Type: CNAME, Name: www, Content: cname.vercel-dns.com

**阿里云：**
- 记录类型: A, 主机记录: @, 记录值: 76.76.19.61
- 记录类型: CNAME, 主机记录: www, 记录值: cname.vercel-dns.com

## 📝 内容管理指南

### 启动 Sanity Studio

1. **本地开发环境**
   ```bash
   cd your-project
   npm run dev
   ```
   访问 `http://localhost:3000/admin` 进入 Sanity Studio

2. **生产环境访问**
   访问 `https://你的域名.com/admin`

### 创建内容

1. **添加作者**
   - 进入 "作者" 部分
   - 填写姓名、上传头像、编写简介

2. **创建分类**
   - 进入 "分类" 部分
   - 添加分类名称和描述

3. **发布文章**
   - 进入 "博客文章" 部分
   - 填写标题、选择作者和分类
   - 上传主图、编写摘要
   - 使用富文本编辑器编写正文
   - 设置发布时间并保存

### 富文本编辑功能

- **文本格式**：加粗、斜体、下划线、删除线
- **标题**：支持 H1-H4 标题
- **列表**：有序列表和无序列表
- **引用**：块引用格式
- **链接**：插入外部链接
- **图片**：上传和插入图片
- **代码**：行内代码格式

## 🔧 本地开发

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **访问网站**
   - 前端：http://localhost:3000
   - Sanity Studio：http://localhost:3000/admin

## 📱 网站功能

### 用户功能
- **浏览文章**：首页展示最新文章
- **分类浏览**：按分类查看文章
- **搜索功能**：全站搜索文章内容
- **响应式设计**：支持手机、平板、桌面端

### 管理员功能
- **内容管理**：通过 Sanity Studio 管理所有内容
- **富文本编辑**：强大的编辑器支持各种格式
- **媒体管理**：上传和管理图片资源
- **预览功能**：实时预览文章效果

## 🔍 SEO 优化

网站已包含完整的 SEO 配置：

- **元数据**：动态生成页面标题和描述
- **Open Graph**：社交媒体分享优化
- **Twitter Cards**：Twitter 分享卡片
- **Sitemap**：自动生成网站地图
- **Robots.txt**：搜索引擎爬虫配置
- **结构化数据**：提升搜索引擎理解

## 🚨 常见问题

### 部署问题

**Q: 部署后页面显示 500 错误**
A: 检查环境变量是否正确配置，特别是 Sanity 相关配置

**Q: Sanity Studio 无法访问**
A: 确保在 Sanity 项目中配置了正确的 CORS 域名

**Q: 图片无法显示**
A: 检查 Sanity 项目的 API 权限和 CDN 配置

### 内容管理问题

**Q: 富文本编辑器功能受限**
A: 检查 blockContent schema 配置是否完整

**Q: 搜索功能不工作**
A: 确保 Sanity 项目有足够的 API 调用配额

## 📞 技术支持

如遇到问题，可以：

1. 查看 [Next.js 文档](https://nextjs.org/docs)
2. 查看 [Sanity 文档](https://www.sanity.io/docs)
3. 查看 [Vercel 文档](https://vercel.com/docs)

## 📄 许可证

MIT License - 可自由使用和修改

---

🎉 恭喜！你的个人博客网站已经准备就绪。开始创作优质内容，与世界分享你的想法吧！
