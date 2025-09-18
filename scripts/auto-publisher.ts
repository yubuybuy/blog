import { AIContentGenerator, AIImageGenerator, ResourceInfo } from '../src/lib/ai-services';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w7iihdoh',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

interface PublishConfig {
  geminiKey?: string;
  cohereKey?: string;
  sanityToken: string;
  autoPublish: boolean;
  publishDelay: number; // 发布间隔(分钟)
}

export class AutoPublisher {
  private contentGenerator: AIContentGenerator;
  private imageGenerator: AIImageGenerator;
  private config: PublishConfig;
  private publishQueue: ResourceInfo[] = [];

  constructor(config: PublishConfig) {
    this.config = config;
    this.contentGenerator = new AIContentGenerator({
      geminiKey: config.geminiKey,
      cohereKey: config.cohereKey
    });
    this.imageGenerator = new AIImageGenerator();
  }

  // 添加资源到发布队列
  addToQueue(resourceInfo: ResourceInfo) {
    this.publishQueue.push(resourceInfo);
    console.log(`Added to queue: ${resourceInfo.title}`);
  }

  // 批量添加资源
  addBatchToQueue(resources: ResourceInfo[]) {
    resources.forEach(resource => this.addToQueue(resource));
  }

  // 开始自动发布流程
  async startAutoPublish() {
    if (this.publishQueue.length === 0) {
      console.log('No items in queue');
      return;
    }

    console.log(`Starting auto publish for ${this.publishQueue.length} items`);

    for (let i = 0; i < this.publishQueue.length; i++) {
      const resource = this.publishQueue[i];

      try {
        await this.publishSingleResource(resource);
        console.log(`✅ Published: ${resource.title}`);

        // 添加延迟，避免被检测为机器行为
        if (i < this.publishQueue.length - 1) {
          const delay = this.config.publishDelay + Math.random() * 10; // 随机化延迟
          console.log(`Waiting ${delay.toFixed(1)} minutes before next publish...`);
          await this.sleep(delay * 60 * 1000);
        }
      } catch (error) {
        console.error(`❌ Failed to publish: ${resource.title}`, error);
        // 失败的项目重新加入队列末尾
        this.publishQueue.push(resource);
      }
    }

    this.publishQueue = []; // 清空队列
    console.log('Auto publish completed');
  }

  // 发布单个资源
  private async publishSingleResource(resourceInfo: ResourceInfo) {
    console.log(`Processing: ${resourceInfo.title}`);

    // 1. 生成内容
    const content = await this.contentGenerator.generateContent(resourceInfo);

    // 2. 生成图片
    const imageUrl = await this.imageGenerator.generateImage(content.imagePrompt);

    // 3. 创建Sanity文档
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
      categories: [
        {
          _type: 'reference',
          _ref: await this.getOrCreateCategory(resourceInfo.category)
        }
      ],
      tags: content.tags,
      resourceLinks: resourceInfo.files,
      mainImage: imageUrl ? {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: await this.uploadImageToSanity(imageUrl)
        }
      } : undefined
    };

    // 4. 发布到Sanity
    if (this.config.autoPublish) {
      const result = await sanityClient.create(post);
      console.log(`Published to Sanity: ${result._id}`);
      return result;
    } else {
      console.log('Auto publish disabled, content generated only');
      return post;
    }
  }

  // 生成URL友好的slug
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .substring(0, 50) + '-' + Date.now(); // 添加时间戳确保唯一性
  }

  // 转换markdown到Sanity block content
  private convertToBlockContent(markdown: string) {
    // 简单的markdown到block转换
    const lines = markdown.split('\n');
    const blocks = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        blocks.push({
          _type: 'block',
          style: 'h1',
          children: [{ _type: 'span', text: line.substring(2) }]
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          _type: 'block',
          style: 'h2',
          children: [{ _type: 'span', text: line.substring(3) }]
        });
      } else if (line.trim()) {
        blocks.push({
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: line }]
        });
      }
    }

    return blocks;
  }

  // 获取或创建分类
  private async getOrCreateCategory(categoryName: string): Promise<string> {
    // 先查找是否存在
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

    return newCategory._id;
  }

  // 上传图片到Sanity
  private async uploadImageToSanity(imageUrl: string): Promise<string> {
    if (imageUrl.startsWith('http')) {
      // 如果是URL，下载并上传
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const asset = await sanityClient.assets.upload('image', blob);
      return asset._id;
    } else {
      // 如果是base64，直接上传
      const buffer = Buffer.from(imageUrl, 'base64');
      const asset = await sanityClient.assets.upload('image', buffer);
      return asset._id;
    }
  }

  // 工具函数：延迟
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 从JSON文件加载资源信息
  static async loadResourcesFromFile(filePath: string): Promise<ResourceInfo[]> {
    try {
      const fs = await import('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        return data;
      } else {
        return [data];
      }
    } catch (error) {
      console.error('Failed to load resources from file:', error);
      return [];
    }
  }
}

// CLI入口
export async function runAutoPublisher() {
  const config: PublishConfig = {
    geminiKey: process.env.GEMINI_API_KEY,
    cohereKey: process.env.COHERE_API_KEY,
    sanityToken: process.env.SANITY_API_TOKEN || '',
    autoPublish: process.env.AUTO_PUBLISH === 'true',
    publishDelay: parseInt(process.env.PUBLISH_DELAY || '30') // 默认30分钟间隔
  };

  const publisher = new AutoPublisher(config);

  // 从resources.json加载资源
  const resources = await AutoPublisher.loadResourcesFromFile('./resources.json');

  if (resources.length > 0) {
    publisher.addBatchToQueue(resources);
    await publisher.startAutoPublish();
  } else {
    console.log('No resources found in resources.json');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runAutoPublisher().catch((error) => console.error('Error:', error instanceof Error ? error.message : error));
}