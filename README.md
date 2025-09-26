# 📱 个人博客 + Telegram网盘自动转存系统

一个集成了现代化个人博客和智能网盘管理功能的完整解决方案。基于 Next.js 14 和 Sanity CMS 构建，同时提供强大的 Telegram 群组网盘链接监听和批量转存功能。

## ✨ 核心功能

### 📝 个人博客系统
- **现代化设计**：简洁美观的响应式设计
- **富文本编辑**：支持加粗、斜体、下划线、图片插入等格式
- **内容管理**：基于 Sanity CMS 的强大后台管理系统
- **文章分类**：支持自定义分类，方便内容组织
- **搜索功能**：全站搜索，快速找到需要的内容
- **SEO 优化**：完整的元数据配置、sitemap、robots.txt
- **AI 内容生成**：集成多个 AI 提供商的内容自动生成功能

### 🚀 Telegram + 网盘自动转存系统
- **智能监听**：7x24小时监听Telegram群组中的网盘链接
- **多平台支持**：夸克、百度、阿里云、天翼云、123云盘
- **自动转存**：批量转存链接到夸克网盘
- **Web管理界面**：实时统计、状态监控、批量操作
- **完善的工具链**：配置验证、系统测试、性能优化

## 🏗️ 系统架构

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   个人博客       │    │  Telegram    │    │   网盘转存       │
│   (Next.js)     │    │  监听系统     │    │   系统          │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                     │
         ▼                       ▼                     ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Sanity CMS    │    │  SQLite      │    │   Quark Pan     │
│   内容管理       │    │  Database    │    │   API           │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## 📦 技术栈

### 前端系统
- **Next.js 15**：现代React框架
- **TypeScript**：类型安全的JavaScript
- **Tailwind CSS**：实用优先的CSS框架
- **Sanity CMS**：无头内容管理系统

### 后端服务
- **Python 3.8+**：核心监听和转存逻辑
- **python-telegram-bot**：Telegram Bot API集成
- **Playwright**：浏览器自动化操作
- **SQLite**：轻量级数据存储
- **AsyncIO**：高性能异步处理

## 🚀 快速开始

### 方法一：完整部署（推荐新用户）

```bash
# 1. 克隆项目
git clone [repository-url]
cd netdisk-blog

# 2. 博客系统设置
npm install
cp .env.local.example .env.local
# 编辑 .env.local 填入 Sanity 配置

# 3. Telegram系统设置
pip install -r requirements.txt
playwright install firefox
cp config/telegram_config.example.json config/telegram_config.json
# 编辑配置文件填入Bot Token和群组ID

# 4. 启动所有服务
npm run system:all
```

### 方法二：分别部署

#### 仅部署博客系统
```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

#### 仅部署Telegram转存系统
```bash
pip install -r requirements.txt
npm run validate:config
npm run telegram:start
# 访问 http://localhost:3000/telegram-quark
```

## 📋 项目结构

```
netdisk-blog/
├── 📁 src/app/
│   ├── telegram-quark/          # Telegram转存Web界面
│   ├── boss-ai/                 # AI内容生成界面
│   ├── api/                     # API接口
│   └── (blog)/                  # 博客系统页面
├── 📁 scripts/
│   ├── telegram_listener.py     # Telegram监听器
│   ├── quark_transfer.py       # 夸克转存器
│   ├── monitor.py              # 系统监控
│   ├── test_system.py          # 集成测试
│   └── optimize_system.py      # 性能优化
├── 📁 config/
│   ├── telegram_config.json    # Telegram配置
│   └── quark_config.json       # 夸克配置
├── 📁 sanity/                  # Sanity CMS配置
├── 📁 data/
│   └── netdisk_links.db        # 链接数据库
├── 📁 logs/                    # 系统日志
├── QUICK_START.md              # 快速开始指南
└── SETUP_GUIDE.md              # 详细部署指南
```

## 🔧 主要命令

### 博客系统
```bash
npm run dev                     # 启动开发服务器
npm run build                   # 构建生产版本
npm run start                   # 启动生产服务器
```

### Telegram转存系统
```bash
npm run system:all              # 一键启动所有服务
npm run telegram:start          # 启动Telegram监听器
npm run quark:transfer          # 运行夸克转存
npm run telegram:monitor        # 系统健康检查
npm run test:system            # 运行集成测试
npm run optimize:all           # 系统性能优化
```

### 系统管理
```bash
npm run validate:config        # 验证配置文件
npm run maintenance            # 定期维护
npm run telegram:cleanup       # 清理旧数据
```

## 🌟 特色功能

### 🤖 AI 内容生成系统
- **多AI提供商**：支持Gemini、Cohere、智谱GLM
- **批量生成**：支持CSV批量导入和生成
- **模板系统**：预设多种内容模板
- **安全认证**：基于Token的访问控制

### 📱 Telegram智能监听
- **实时监控**：7x24小时群组消息监听
- **智能提取**：自动识别网盘链接和提取码
- **去重处理**：避免重复处理相同链接
- **状态跟踪**：完整的处理状态记录

### 🚀 批量转存系统
- **多平台支持**：夸克、百度、阿里云、天翼云、123云盘
- **智能排队**：合理控制转存频率避免限制
- **断点续传**：支持失败重试和状态恢复
- **Web界面管理**：可视化的转存控制和监控

### 📊 完整的监控体系
- **实时统计**：链接数量、成功率等关键指标
- **系统监控**：服务状态、资源使用情况
- **性能优化**：数据库优化、日志清理
- **健康检查**：定期系统状态检查

## 🛠️ 部署指南

### Vercel 部署（博客系统）
1. 推送代码到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署完成

### 本地部署（完整系统）
详细步骤请参考：
- [📖 快速开始指南](QUICK_START.md)
- [🔧 详细部署指南](SETUP_GUIDE.md)

## 🔒 安全特性

- **Token认证**：API访问基于安全Token验证
- **访问控制**：Web界面权限控制
- **配置分离**：敏感信息与代码分离
- **日志审计**：详细的操作日志记录

## 📈 性能优化

- **数据库索引**：优化查询性能
- **异步处理**：高并发请求处理
- **缓存机制**：减少重复计算
- **资源优化**：定期清理和压缩

## 🤝 社区支持

### 📚 文档资源
- [📖 快速开始](QUICK_START.md) - 5分钟快速部署
- [🔧 详细部署指南](SETUP_GUIDE.md) - 完整操作步骤
- [⚙️ 配置说明](config/) - 详细配置文档

### 🆘 获得帮助
- 🔍 查看日志：`logs/` 目录
- 🧪 运行测试：`npm run test:system`
- 🔧 系统检查：`npm run telegram:monitor`

## 📝 许可证

本项目遵循 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢 [QuarkPanTool](https://github.com/ihmily/QuarkPanTool) 提供的夸克网盘API参考
- 感谢 Next.js 和 Sanity 团队提供的优秀框架

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！

🐛 遇到问题？欢迎提交Issue或Pull Request！

🎉 **现在你拥有了一个完整的个人博客 + 智能网盘管理系统！**
