// AI服务集成 - 免费API轮换使用
export interface ResourceInfo {
  title: string;
  category: string;
  files: string[];
  tags: string[];
  description?: string;
  type?: string;
}

export interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
}

// Google Gemini API (免费60次/月)
class GeminiService {
  private apiKey: string;
  private usageCount: number = 0;
  private maxUsage: number = 50; // 留10次余量

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
    if (this.usageCount >= this.maxUsage) {
      console.log('Gemini usage limit reached');
      return null;
    }

    try {
      const prompt = this.buildPrompt(resourceInfo);

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + this.apiKey, {
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

      if (!response.ok) throw new Error('Gemini API failed');

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      this.usageCount++;
      return this.parseResponse(text);
    } catch (error) {
      console.error('Gemini error:', error);
      return null;
    }
  }

  private buildPrompt(resourceInfo: ResourceInfo): string {
    return `
请为以下网盘资源生成文章内容，要求规避版权风险：

资源信息：
- 分类：${resourceInfo.category}
- 标签：${resourceInfo.tags.join(', ')}
- 描述：${resourceInfo.description || ''}

要求：
1. 标题要通用化，避免具体作品名称
2. 描述重点强调资源特性，不涉及具体内容
3. 内容要有价值，包含使用建议
4. 添加免责声明
5. 生成配图提示词(抽象、无版权)

请按JSON格式返回：
{
  "title": "文章标题",
  "excerpt": "文章摘要",
  "content": "文章正文(markdown格式)",
  "tags": ["标签1", "标签2"],
  "imagePrompt": "配图提示词"
}
    `;
  }

  private parseResponse(text: string): GeneratedContent {
    try {
      // 提取JSON部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }

    // 降级处理
    return this.createFallbackContent();
  }

  private createFallbackContent(): GeneratedContent {
    return {
      title: "精选资源分享",
      excerpt: "为您整理的高质量资源合集",
      content: "# 资源介绍\n\n本次为大家整理了优质资源合集...",
      tags: ["资源", "分享"],
      imagePrompt: "abstract digital art, blue and purple gradient"
    };
  }
}

// Cohere API (免费100次/月)
class CohereService {
  private apiKey: string;
  private usageCount: number = 0;
  private maxUsage: number = 90;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
    if (this.usageCount >= this.maxUsage) {
      console.log('Cohere usage limit reached');
      return null;
    }

    try {
      const prompt = `创建一篇关于${resourceInfo.category}资源的文章，避免版权风险...`;

      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error('Cohere API failed');

      const data = await response.json();
      this.usageCount++;

      return this.processCohereResponse(data.generations[0].text, resourceInfo);
    } catch (error) {
      console.error('Cohere error:', error);
      return null;
    }
  }

  private processCohereResponse(text: string, resourceInfo: ResourceInfo): GeneratedContent {
    return {
      title: `${resourceInfo.category}资源精选合集`,
      excerpt: text.substring(0, 100) + '...',
      content: `# ${resourceInfo.category}资源分享\n\n${text}`,
      tags: resourceInfo.tags,
      imagePrompt: `${resourceInfo.category.toLowerCase()} themed abstract art`
    };
  }
}

// 模板生成服务 (备用方案)
class TemplateService {
  generateContent(resourceInfo: ResourceInfo): GeneratedContent {
    const templates = {
      电影: {
        title: "精选影视资源合集",
        excerpt: "为影视爱好者整理的高质量资源分享",
        content: `# 影视资源分享

## 资源特色
- 高清画质，观影体验佳
- 分类清晰，便于查找
- 定期更新，保持新鲜度

## 使用说明
请仅用于个人学习交流，支持正版内容。

## 免责声明
本站仅提供信息分享，不承担任何版权责任。如有侵权，请联系删除。`,
        imagePrompt: "cinema abstract art, film reels, dark blue theme"
      },
      软件: {
        title: "实用软件工具分享",
        excerpt: "精选实用软件工具，提升工作效率",
        content: `# 软件工具分享

## 工具特点
- 功能实用，操作简便
- 兼容性好，稳定可靠
- 定期测试，确保可用

## 安装建议
请从官方渠道下载，确保安全性。

## 免责声明
请支持正版软件，本分享仅供学习交流。`,
        imagePrompt: "software icons abstract, technology theme, modern design"
      }
    };

    const template = templates[resourceInfo.category as keyof typeof templates] || templates.软件;

    return {
      ...template,
      tags: resourceInfo.tags.length > 0 ? resourceInfo.tags : ['资源', '分享']
    };
  }
}

// 主要的AI内容生成器
export class AIContentGenerator {
  private gemini: GeminiService | null = null;
  private cohere: CohereService | null = null;
  private template: TemplateService = new TemplateService();

  constructor(config: { geminiKey?: string; cohereKey?: string }) {
    if (config.geminiKey) {
      this.gemini = new GeminiService(config.geminiKey);
    }
    if (config.cohereKey) {
      this.cohere = new CohereService(config.cohereKey);
    }
  }

  async generateContent(resourceInfo: ResourceInfo): Promise<GeneratedContent> {
    // 按优先级尝试各个服务
    const services = [this.gemini, this.cohere].filter(s => s !== null);

    for (const service of services) {
      try {
        const result = await service!.generateContent(resourceInfo);
        if (result) {
          console.log(`Content generated by ${service.constructor.name}`);
          return result;
        }
      } catch (error) {
        console.error(`${service?.constructor.name} failed:`, error);
        continue;
      }
    }

    // 最后使用模板
    console.log('Falling back to template generation');
    return this.template.generateContent(resourceInfo);
  }
}

// 图片生成服务
export class AIImageGenerator {
  async generateImage(prompt: string): Promise<string | null> {
    try {
      // 使用免费的Stable Diffusion API
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 20,
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.artifacts[0].base64;
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    }

    // 降级：返回Unsplash随机图片
    const unsplashUrl = `https://source.unsplash.com/800x600/?abstract,digital`;
    return unsplashUrl;
  }
}