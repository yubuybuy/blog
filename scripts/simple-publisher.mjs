#!/usr/bin/env node

// JavaScript版本的AI自动发布脚本
import { createClient } from '@sanity/client';
import fs from 'fs';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

// 简化的内容生成器
class SimpleContentGenerator {
  generateContent(resourceInfo) {
    const templates = {
      电影: {
        titlePrefix: "精选影视资源",
        contentTemplate: `# 影视资源分享

## 资源特色
- 高清画质，观影体验佳
- 精选内容，值得收藏
- 多种格式，兼容性好

## 使用说明
本资源仅供个人学习交流使用，请勿用于商业用途。

## 免责声明
本站仅提供信息分享，不存储任何文件。所有资源均来源于网络，如有版权问题，请联系删除。支持正版，从我做起。`,
        imagePrompt: "cinema abstract art, film reels, dark blue theme"
      },
      软件: {
        titlePrefix: "实用软件工具",
        contentTemplate: `# 软件工具分享

## 工具特点
- 功能实用，操作简便
- 兼容性好，稳定可靠
- 定期测试，确保可用

## 安装建议
建议从官方渠道验证软件安全性。

## 免责声明
请支持正版软件，本分享仅供学习交流。如有版权问题，请联系删除。`,
        imagePrompt: "software icons abstract, technology theme, modern design"
      },
      教育: {
        titlePrefix: "优质学习资源",
        contentTemplate: `# 学习资料分享

## 资源亮点
- 内容丰富，覆盖面广
- 结构清晰，易于学习
- 持续更新，保持新鲜

## 学习建议
建议制定学习计划，循序渐进。

## 免责声明
本资源仅供学习交流使用，请尊重知识产权。如有版权问题，请联系删除。`,
        imagePrompt: "education theme, books and knowledge, warm colors"
      }
    };

    const template = templates[resourceInfo.category] || templates.软件;

    return {
      title: `${template.titlePrefix}分享`,
      excerpt: `为您整理的${resourceInfo.category}资源，${resourceInfo.description?.substring(0, 50)}...`,
      content: template.contentTemplate,
      tags: resourceInfo.tags || ['资源', '分享'],
      imagePrompt: template.imagePrompt
    };
  }
}

// 主要发布器
class SimplePublisher {
  constructor() {
    this.contentGenerator = new SimpleContentGenerator();
  }

  async publishResources() {
    console.log('🚀 开始AI自动发布流程...\n');

    try {
      // 1. 加载资源
      const resources = await this.loadResources();
      console.log(`📊 加载到 ${resources.length} 个资源`);

      if (resources.length === 0) {
        console.log('ℹ️ 没有新资源需要发布');
        return;
      }

      // 2. 逐个发布
      for (const resource of resources) {
        try {
          await this.publishSingleResource(resource);
          await this.markAsPublished(resource.title);
          console.log(`✅ 成功发布: ${resource.title}`);
        } catch (error) {
          console.error(`❌ 发布失败: ${resource.title}`, error.message);
        }
      }

      console.log('\n🎉 发布流程完成！');

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
          publishedTitles = publishedContent.split('\n').filter(line => line.trim());
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
    console.log(`📝 处理资源: ${resourceInfo.title}`);

    // 1. 生成内容
    const content = this.contentGenerator.generateContent(resourceInfo);

    // 2. 获取或创建分类
    const categoryId = await this.getOrCreateCategory(resourceInfo.category);

    // 3. 创建文章
    const post = {
      _type: 'post',
      title: content.title,
      slug: {
        _type: 'slug',
        current: this.generateSlug(content.title)
      },
      excerpt: content.excerpt,
      publishedAt: new Date().toISOString(),
      body: this.convertToBlockContent(content.content),
      categories: categoryId ? [{
        _type: 'reference',
        _ref: categoryId
      }] : [],
      tags: content.tags,
      resourceLinks: resourceInfo.files
    };

    // 4. 发布到Sanity
    const result = await sanityClient.create(post);
    console.log(`📄 文章已创建: ${result._id}`);
    return result;
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
      const newCategory = await sanityClient.create({
        _type: 'category',
        title: categoryName,
        slug: {
          _type: 'slug',
          current: categoryName.toLowerCase().replace(/\s+/g, '-')
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
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now();
  }

  convertToBlockContent(markdown) {
    const lines = markdown.split('\n');
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
      fs.appendFileSync('./processed/published-titles.txt', title + '\n');
    } catch (error) {
      console.error('❌ 记录发布状态失败:', error.message);
    }
  }
}

// 运行发布器
async function runPublisher() {
  try {
    const publisher = new SimplePublisher();
    await publisher.publishResources();
  } catch (error) {
    console.error('🚨 发布器运行失败:', error.message);
    process.exit(1);
  }
}

runPublisher();