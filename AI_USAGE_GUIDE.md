# AI全托管网站使用指南

## 🎯 功能概述

这个系统可以实现完全自动化的网站内容发布：
- 你只需要提供网盘资源信息
- AI自动生成文章标题、内容、配图
- 自动发布到你的博客网站
- 智能规避版权风险

## 🚀 快速开始

### 1. 获取免费AI API密钥

**Google Gemini (推荐)**
1. 访问 https://makersuite.google.com/app/apikey
2. 登录Google账号
3. 点击"Create API Key"
4. 复制API密钥

**Cohere (备用)**
1. 访问 https://dashboard.cohere.ai/api-keys
2. 注册账号
3. 在Dashboard中创建API Key

### 2. 配置GitHub仓库Secrets

在你的GitHub仓库中设置以下Secrets：

1. 进入仓库 Settings > Secrets and variables > Actions
2. 添加以下Secret：
   ```
   GEMINI_API_KEY=你的Gemini密钥
   COHERE_API_KEY=你的Cohere密钥 (可选)
   SANITY_API_TOKEN=你的Sanity令牌
   ```

### 3. 准备资源信息

编辑 `resources.json` 文件，添加你的网盘资源：

```json
[
  {
    "title": "最新电影合集",
    "category": "电影",
    "type": "影视资源",
    "files": [
      "https://pan.baidu.com/s/xxx",
      "https://www.aliyundrive.com/s/xxx"
    ],
    "tags": ["2024", "电影", "高清"],
    "description": "包含最新热门电影，画质清晰"
  }
]
```

### 4. 推送到GitHub触发发布

```bash
git add resources.json
git commit -m "添加新资源"
git push
```

## 📋 详细使用流程

### 资源信息格式

每个资源需要包含以下字段：

```json
{
  "title": "资源标题",           // 必填：简短描述
  "category": "分类",          // 必填：电影/软件/游戏/教育等
  "type": "资源类型",          // 可选：更具体的分类
  "files": ["链接1", "链接2"], // 必填：网盘链接数组
  "tags": ["标签1", "标签2"],  // 必填：SEO标签
  "description": "详细描述",   // 可选：资源详情
  "metadata": {               // 可选：额外信息
    "quality": "高清",
    "format": "MP4",
    "size": "2GB"
  }
}
```

### 自动发布规则

**触发条件**：
- 更新 `resources.json` 文件后推送
- 每天自动运行3次 (9点/15点/21点)
- 手动触发 GitHub Action

**发布策略**：
- 每次发布间隔30分钟以上
- 随机化发布时间避免机器识别
- 自动轮换使用免费AI服务

**安全保障**：
- 自动过滤版权敏感词汇
- 生成通用化标题和内容
- 包含免责声明
- 使用AI生成的抽象配图

## 🛠️ 高级配置

### 自定义发布参数

在GitHub Actions中可以调整：

```yaml
env:
  AUTO_PUBLISH: 'true'          # 是否自动发布
  PUBLISH_DELAY: '30'           # 发布间隔(分钟)
  PUBLISH_COUNT: '1'            # 每次发布数量
```

### 内容生成规则

编辑 `AI_CONTENT_RULES.md` 自定义：
- 禁用词汇列表
- 标题生成模板
- 内容结构规则
- 图片生成提示词

### 本地测试

运行测试脚本检查系统状态：

```bash
npm run test:publisher
```

## 📊 成本分析

### 免费方案 (推荐)
- **Gemini**: 60次/月免费
- **Cohere**: 100次/月免费
- **GitHub Actions**: 2000分钟/月免费
- **Vercel**: 无限制
- **总成本**: $0/月

### 预期发布量
- 免费额度下：每天3-5篇文章
- 每月约100-150篇文章
- 足够维持活跃的博客更新

## 🔧 故障排除

### 常见问题

**Q: AI生成失败怎么办？**
A: 系统会自动降级到模板生成，确保始终有内容产出

**Q: API额度用完了？**
A: 系统会自动切换到下一个AI服务，最后使用模板

**Q: 如何查看发布状态？**
A: 在GitHub Actions页面查看运行日志

**Q: 内容质量不满意？**
A: 可以在 `AI_CONTENT_RULES.md` 中调整生成规则

### 日志查看

1. 进入GitHub仓库
2. 点击 Actions 标签
3. 查看最新的工作流运行结果

### 手动干预

如需停止自动发布：
1. 在仓库Settings中禁用Actions
2. 或者设置 `AUTO_PUBLISH: 'false'`

## 📈 优化建议

### 提升内容质量
- 提供更详细的资源描述
- 使用多样化的标签
- 定期更新生成规则

### 增加发布频率
- 申请多个免费AI账号
- 混合使用不同AI服务
- 升级到付费API (成本约$20/月)

### SEO优化
- 研究热门关键词
- 优化标题和标签
- 定期分析流量数据

## 🚨 重要提醒

### 版权合规
- 避免直接提及版权内容
- 使用通用化描述
- 及时响应删除请求

### 账号安全
- 定期更换API密钥
- 监控异常访问
- 备份重要数据

### 内容质量
- 定期检查生成内容
- 调整AI提示词
- 保持内容价值

---

## 📞 支持

遇到问题可以：
1. 查看GitHub Issues
2. 阅读 `AI_CONTENT_RULES.md`
3. 运行测试脚本诊断问题

🎉 恭喜！你的AI全托管网站已经准备就绪，开始享受自动化内容发布吧！