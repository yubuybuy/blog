#!/usr/bin/env node

// 真正的AI内容生成发布器
import { createClient } from '@sanity/client';
import fs from 'fs';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

// AI内容生成器
class AIContentGenerator {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.cohereKey = process.env.COHERE_API_KEY;
  }

  async generateContent(resourceInfo) {
    console.log(`🤖 为 "${resourceInfo.title}" 生成AI内容...`);

    try {
      // 优先使用Gemini API
      if (this.geminiKey) {
        return await this.generateWithGemini(resourceInfo);
      }

      // 备选Cohere API
      if (this.cohereKey) {
        return await this.generateWithCohere(resourceInfo);
      }

      // 如果没有API密钥，使用增强模板
      return this.generateWithTemplate(resourceInfo);

    } catch (error) {
      console.error('❌ AI生成失败，使用模板:', error.message);
      return this.generateWithTemplate(resourceInfo);
    }
  }

  async generateWithGemini(resourceInfo) {
    const prompt = `请为以下网盘资源生成一篇博客文章：

标题：${resourceInfo.title}
分类：${resourceInfo.category}
描述：${resourceInfo.description}
标签：${resourceInfo.tags?.join(', ')}

要求：
1. 生成吸引人的文章内容
2. 包含资源介绍和特色
3. 添加使用说明
4. 包含免责声明
5. 内容要原创且有价值
6. 使用Markdown格式

请直接返回文章内容，不要包含其他说明文字。`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content generated from Gemini');
    }

    return {
      content: content,
      aiGenerated: true,
      model: 'gemini-pro'
    };
  }

  async generateWithCohere(resourceInfo) {
    const prompt = `为网盘资源"${resourceInfo.title}"生成博客文章内容。分类：${resourceInfo.category}。描述：${resourceInfo.description}。要求原创有价值的内容，包含资源介绍、特色、使用说明和免责声明。使用Markdown格式。`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.cohereKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.generations?.[0]?.text;

    if (!content) {
      throw new Error('No content generated from Cohere');
    }

    return {
      content: content.trim(),
      aiGenerated: true,
      model: 'cohere-command'
    };
  }

  generateWithTemplate(resourceInfo) {
    const templates = {
      电影: {
        content: `# ${resourceInfo.title}

${resourceInfo.description}

## 🎬 资源特色

- 精心挑选的优质内容
- 高清画质，观影体验佳
- 多种格式，设备兼容性好
- 更新及时，内容丰富

## 📋 使用说明

本资源仅供个人学习和交流使用，请支持正版内容。

## ⚠️ 免责声明

本站仅提供资源信息分享，不存储任何文件。所有资源均来源于网络公开分享，如有版权问题，请联系删除。

**请支持正版，尊重版权！**`
      },
      软件: {
        content: `# ${resourceInfo.title}

${resourceInfo.description}

## 🛠️ 工具特点

- 功能实用，操作简便
- 兼容性好，稳定可靠
- 定期测试，确保可用
- 持续更新，功能完善

## 📝 安装说明

请从官方渠道下载并验证软件完整性和安全性。

## ⚠️ 免责声明

请支持正版软件，本分享仅供学习交流。如有版权问题，请联系删除。`
      },
      教育: {
        content: `# ${resourceInfo.title}

${resourceInfo.description}

## 📚 资源亮点

- 内容丰富，覆盖面广
- 结构清晰，易于学习
- 持续更新，保持新鲜
- 适合自学和提升

## 💡 学习建议

建议制定合理的学习计划，循序渐进地掌握知识。

## ⚠️ 免责声明

本资源仅供学习交流使用，请尊重知识产权。如有版权问题，请联系删除。`
      }
    };

    const template = templates[resourceInfo.category] || templates.软件;

    return {
      content: template.content,
      aiGenerated: false,
      model: 'template'
    };
  }
}

// AI发布器
class AIAutoPublisher {
  constructor() {
    this.contentGenerator = new AIContentGenerator();
  }

  async publishResources() {
    console.log('🚀 开始AI自动发布流程...\n');

    try {
      // 检查API密钥状态
      const hasGemini = !!process.env.GEMINI_API_KEY;
      const hasCohere = !!process.env.COHERE_API_KEY;

      console.log(`🔑 API状态:`);
      console.log(`- Gemini API: ${hasGemini ? '✅ 可用' : '❌ 未配置'}`);
      console.log(`- Cohere API: ${hasCohere ? '✅ 可用' : '❌ 未配置'}`);

      if (!hasGemini && !hasCohere) {
        console.log('⚠️ 未检测到AI API密钥，将使用增强模板生成内容\n');
      }

      // 加载资源
      const resources = await this.loadResources();
      console.log(`📊 加载到 ${resources.length} 个新资源\n`);

      if (resources.length === 0) {
        console.log('ℹ️ 没有新资源需要发布');
        return;
      }

      // 逐个发布
      for (const resource of resources) {
        try {
          console.log(`📝 处理资源: ${resource.title}`);
          await this.publishSingleResource(resource);
          await this.markAsPublished(resource.title);
          console.log(`✅ 成功发布: ${resource.title}\n`);
        } catch (error) {
          console.error(`❌ 发布失败: ${resource.title}`, error.message);
        }
      }

      console.log('🎉 发布流程完成！');

    } catch (error) {
      console.error('🚨 发布流程出错:', error.message);
      throw error;
    }
  }

  async loadResources() {
    try {
      const content = fs.readFileSync('./resources.json', 'utf-8');
      const data = JSON.parse(content);
      const resources = Array.isArray(data) ? data : [data];

      // 检查已发布记录
      let publishedTitles = [];
      try {
        if (fs.existsSync('./processed/published-titles.txt')) {
          const publishedContent = fs.readFileSync('./processed/published-titles.txt', 'utf-8');
          publishedTitles = publishedContent.split('\\n').filter(line => line.trim());
        }
      } catch (error) {
        console.log('📝 没有找到已发布记录，将发布所有资源');
      }

      // 过滤已发布的资源
      const newResources = resources.filter(resource =>
        !publishedTitles.includes(resource.title)
      );

      console.log(`📈 总资源: ${resources.length}, 新资源: ${newResources.length}`);
      return newResources;

    } catch (error) {
      console.error('❌ 加载资源失败:', error.message);
      return [];
    }
  }

  async publishSingleResource(resourceInfo) {
    // 1. 生成AI内容
    const result = await this.contentGenerator.generateContent(resourceInfo);
    console.log(`🤖 内容生成完成 (${result.model})`);

    // 2. 获取或创建分类
    const categoryId = await this.getOrCreateCategory(resourceInfo.category);

    // 3. 创建文章
    const post = {
      _type: 'post',
      title: resourceInfo.title,
      slug: {
        _type: 'slug',
        current: this.generateSlug(resourceInfo.title)
      },
      excerpt: resourceInfo.description?.substring(0, 200) + '...',
      publishedAt: new Date().toISOString(),
      body: this.convertToBlockContent(result.content),
      categories: categoryId ? [{
        _type: 'reference',
        _ref: categoryId
      }] : [],
      tags: resourceInfo.tags || ['资源', '分享'],
      resourceLinks: resourceInfo.files,
      // 记录AI生成信息
      aiGenerated: result.aiGenerated,
      aiModel: result.model
    };

    // 4. 发布到Sanity
    const publishResult = await sanityClient.create(post);
    console.log(`📄 文章已创建: ${publishResult._id}`);
    return publishResult;
  }

  async getOrCreateCategory(categoryName) {
    try {
      // 查找现有分类
      const existing = await sanityClient.fetch(
        `*[_type == "category" && title == $title][0]`,
        { title: categoryName }
      );

      if (existing) {
        return existing._id;
      }

      // 创建新分类
      const categorySlugMap = {
        '电影': 'movies',
        '软件': 'software',
        '教育': 'education',
        '游戏': 'games',
        '音乐': 'music',
        '图书': 'books',
        '其他': 'others'
      };

      const slug = categorySlugMap[categoryName] || categoryName
        .toLowerCase()
        .replace(/[^\\w\\s-]/g, '')
        .replace(/\\s+/g, '-');

      const newCategory = await sanityClient.create({
        _type: 'category',
        title: categoryName,
        slug: {
          _type: 'slug',
          current: slug
        },
        description: `${categoryName}相关资源分享`
      });

      console.log(`📁 创建新分类: ${categoryName}`);
      return newCategory._id;

    } catch (error) {
      console.error(`❌ 分类处理失败: ${categoryName}`, error.message);
      return null;
    }
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\\w\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .substring(0, 50) + '-' + Date.now();
  }

  convertToBlockContent(markdown) {
    const lines = markdown.split('\\n');
    const blocks = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('# ')) {
        blocks.push({
          _type: 'block',
          style: 'h1',
          children: [{ _type: 'span', text: trimmed.substring(2) }]
        });
      } else if (trimmed.startsWith('## ')) {
        blocks.push({
          _type: 'block',
          style: 'h2',
          children: [{ _type: 'span', text: trimmed.substring(3) }]
        });
      } else if (trimmed.startsWith('### ')) {
        blocks.push({
          _type: 'block',
          style: 'h3',
          children: [{ _type: 'span', text: trimmed.substring(4) }]
        });
      } else if (trimmed.startsWith('- ')) {
        blocks.push({
          _type: 'block',
          style: 'normal',
          listItem: 'bullet',
          children: [{ _type: 'span', text: trimmed.substring(2) }]
        });
      } else {
        blocks.push({
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: trimmed }]
        });
      }
    }

    return blocks;
  }

  async markAsPublished(title) {
    try {
      if (!fs.existsSync('./processed')) {
        fs.mkdirSync('./processed', { recursive: true });
      }
      fs.appendFileSync('./processed/published-titles.txt', title + '\\n');
    } catch (error) {
      console.error('❌ 记录发布状态失败:', error.message);
    }
  }
}

// 运行AI发布器
async function runAIPublisher() {
  try {
    const publisher = new AIAutoPublisher();
    await publisher.publishResources();
  } catch (error) {
    console.error('🚨 AI发布器运行失败:', error.message);
    process.exit(1);
  }
}

runAIPublisher();