// 中国AI服务商集成 - 解决地区访问限制
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

// 百度文心一言服务 (推荐)
class BaiduService {
  private apiKey: string;
  private secretKey: string;
  private accessToken: string | null = null;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`, {
        method: 'POST'
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      throw new Error('Failed to get Baidu access token');
    }
  }

  async generateContent(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
    try {
      const token = await this.getAccessToken();
      const prompt = this.buildPrompt(resourceInfo);

      const response = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) throw new Error('Baidu API failed');

      const data = await response.json();
      const text = data.result;

      return this.parseResponse(text);
    } catch (error) {
      console.error('Baidu error:', error);
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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }

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

// 智谱GLM服务
class ZhipuService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
    try {
      const prompt = this.buildPrompt(resourceInfo);

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "glm-4",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) throw new Error('Zhipu API failed');

      const data = await response.json();
      const text = data.choices[0].message.content;

      return this.parseResponse(text);
    } catch (error) {
      console.error('Zhipu error:', error);
      return null;
    }
  }

  private buildPrompt(resourceInfo: ResourceInfo): string {
    return `请为网盘资源"${resourceInfo.category}"生成文章，避免版权问题，返回JSON格式包含title、excerpt、content、tags、imagePrompt字段`;
  }

  private parseResponse(text: string): GeneratedContent {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }

    return {
      title: `${Math.random() > 0.5 ? '精选' : '优质'}${Math.random() > 0.5 ? '资源' : '内容'}分享`,
      excerpt: "为您精心整理的高质量资源合集",
      content: "# 资源介绍\n\n本次为大家整理了优质资源合集，希望对大家有所帮助。",
      tags: ["资源", "分享"],
      imagePrompt: "abstract digital art, colorful gradient"
    };
  }
}

// 增强的模板服务 (备用方案)
class AdvancedTemplateService {
  generateContent(resourceInfo: ResourceInfo): GeneratedContent {
    const templates = {
      电影: [
        {
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
        {
          title: "影视资源精选推荐",
          excerpt: "优质影视内容资源整理分享",
          content: `# 影视内容推荐

## 精选特点
- 内容丰富多样
- 画质清晰流畅
- 更新及时稳定

## 观看建议
建议在良好网络环境下观看，获得最佳体验。

## 版权声明
所有内容仅供学习交流使用，请支持正版。`,
          imagePrompt: "movie poster style, abstract cinema elements"
        }
      ],
      软件: [
        {
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
      ]
    };

    const categoryTemplates = templates[resourceInfo.category as keyof typeof templates] || templates.软件;
    const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

    return {
      ...template,
      tags: resourceInfo.tags.length > 0 ? resourceInfo.tags : ['资源', '分享']
    };
  }
}

// 中国AI内容生成器
export class ChinaAIContentGenerator {
  private baidu: BaiduService | null = null;
  private zhipu: ZhipuService | null = null;
  private template: AdvancedTemplateService = new AdvancedTemplateService();

  constructor(config: {
    baiduApiKey?: string;
    baiduSecretKey?: string;
    zhipuApiKey?: string;
  }) {
    if (config.baiduApiKey && config.baiduSecretKey) {
      this.baidu = new BaiduService(config.baiduApiKey, config.baiduSecretKey);
    }
    if (config.zhipuApiKey) {
      this.zhipu = new ZhipuService(config.zhipuApiKey);
    }
  }

  async generateContent(resourceInfo: ResourceInfo): Promise<GeneratedContent> {
    // 按优先级尝试各个服务
    const services = [this.baidu, this.zhipu].filter(s => s !== null);

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

    // 最后使用增强模板
    console.log('Using advanced template generation');
    return this.template.generateContent(resourceInfo);
  }
}

export default ChinaAIContentGenerator;