# AI内容生成规则配置

## 版权安全规则

### 禁用词汇 (避免直接提及版权内容)
- 具体电影名称 (如：阿凡达、复仇者联盟)
- 具体软件品牌 (如：Adobe Photoshop、Microsoft Office)
- 明星真实姓名
- 具体游戏名称
- 音乐专辑/歌手名称

### 替换策略
- "最新大片" 代替 具体电影名
- "知名设计软件" 代替 Photoshop
- "办公套件" 代替 Office
- "热门游戏" 代替 具体游戏名
- "流行音乐" 代替 具体歌手/专辑

## 内容生成模板

### 标题模板
```
通用模板：
- "${category}精选资源合集"
- "高质量${type}分享"
- "最新${category}整理"
- "${year}年度${category}推荐"

示例：
- "影视精选资源合集"
- "高质量办公软件分享"
- "最新学习资料整理"
- "2024年度设计工具推荐"
```

### 内容结构模板
```markdown
# ${title}

## 📦 资源介绍
${description}

## ⭐ 资源特色
- 高质量精选内容
- 分类清晰，便于查找
- 定期更新，保持新鲜度
- 多个备用链接，确保可用性

## 📋 资源列表
${generateResourceList()}

## 💡 使用建议
- 建议使用稳定的网络环境下载
- 支持断点续传，避免重复下载
- 请妥善保存，资源仅供学习交流

## ⚠️ 免责声明
本站仅提供资源信息分享，不存储任何文件。所有资源均来源于网络，仅供学习交流使用。如有版权问题，请联系删除。

## 🔗 获取方式
访问下方链接即可获取资源，如链接失效请及时反馈。

${links}
```

### 摘要模板
```
- "为${category}爱好者精心整理的优质资源合集"
- "包含${count}个精选${type}，助力提升学习效率"
- "高质量${category}资源分享，定期更新维护"
```

## AI提示词优化

### Gemini提示词
```
你是一个专业的资源分享博客作者，需要为网盘资源生成文章。

要求：
1. 标题通用化，避免版权风险
2. 内容有价值，提供使用建议
3. 语言自然，不要机器感
4. 包含适当的免责声明
5. 重点描述资源特性而非内容本身

生成格式：严格按JSON返回，包含title、excerpt、content、tags、imagePrompt字段。

资源信息：${resourceInfo}
```

### Cohere提示词
```
创建一篇关于${category}资源的分享文章。要求避免版权争议，重点描述资源的价值和使用方法。语言要自然友好，适合个人博客风格。文章长度适中，包含实用建议。
```

## 图片生成提示词

### 分类对应的提示词
```javascript
const imagePrompts = {
  电影: "cinema abstract art, film reels, purple and blue gradient, modern minimal",
  软件: "technology icons, circuit patterns, blue theme, digital abstract",
  游戏: "gaming controller silhouette, neon colors, cyber theme, abstract",
  音乐: "sound waves, music notes, colorful gradient, artistic abstract",
  教育: "books and graduation cap, knowledge theme, warm colors, inspiring",
  设计: "creative tools, palette colors, artistic brushes, designer theme",
  默认: "digital cloud storage, file sharing, modern tech, clean design"
}
```

### 通用安全提示词后缀
```
", no text, no logos, no copyrighted content, abstract style, professional quality"
```

## 发布时间策略

### 最佳发布时间
- 工作日: 9:00-11:00, 14:00-16:00, 20:00-22:00
- 周末: 10:00-12:00, 15:00-17:00, 20:00-22:00

### 发布间隔
- 最小间隔: 30分钟
- 推荐间隔: 2-4小时
- 每日最多: 6篇文章
- 随机延迟: ±15分钟

## 内容变化策略

### 标题变化
- 使用同义词替换
- 调整句式结构
- 添加时间标识符
- 随机选择模板

### 内容变化
- 段落顺序调整
- 同义词随机替换
- 详细程度变化
- 语言风格微调

## 质量控制

### 内容检查点
- [ ] 标题无版权风险词汇
- [ ] 内容有实际价值
- [ ] 包含免责声明
- [ ] 图片提示词安全
- [ ] 链接格式正确
- [ ] 语言自然流畅

### 自动审核规则
```javascript
const contentRules = {
  titleMaxLength: 50,
  excerptMaxLength: 200,
  contentMinLength: 300,
  maxTagsCount: 8,
  forbiddenWords: ['盗版', '破解', '免费下载'],
  requiredElements: ['免责声明', '使用建议']
}
```