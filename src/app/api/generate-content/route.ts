// Vercel API路由 - 在服务器端生成AI内容
// 文件路径: src/app/api/generate-content/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

interface ResourceInfo {
  title: string;
  category: string;
  files: string[];
  tags: string[];
  description?: string;
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
}

// Google Gemini AI生成
async function generateWithGemini(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `
请为以下网盘资源生成博客文章，要求规避版权风险：

资源信息：
- 分类：${resourceInfo.category}
- 标签：${resourceInfo.tags.join(', ')}
- 描述：${resourceInfo.description || ''}

要求：
1. 标题通用化，避免具体作品名称
2. 重点强调资源特性和使用价值
3. 包含免责声明
4. 内容300-500字

请按JSON格式返回：
{
  "title": "文章标题",
  "excerpt": "文章摘要",
  "content": "文章正文(markdown格式)",
  "tags": ["标签1", "标签2"],
  "imagePrompt": "配图提示词"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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
    const text = data.candidates[0].content.parts[0].text;

    // 解析JSON响应
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
      }
    }

    // 降级处理
    return {
      title: `${resourceInfo.category}精选资源分享`,
      excerpt: `为您整理的高质量${resourceInfo.category}资源，包含${resourceInfo.tags.slice(0, 2).join('、')}等内容。`,
      content: `# ${resourceInfo.category}资源分享\n\n本次为大家整理了优质${resourceInfo.category}资源，经过精心筛选，确保质量。\n\n## 免责声明\n本站仅提供信息分享，请支持正版内容。`,
      tags: resourceInfo.tags,
      imagePrompt: 'abstract digital art, modern design'
    };

  } catch (error) {
    console.error('Gemini生成失败:', error);
    return null;
  }
}

// Cohere AI生成
async function generateWithCohere(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `为"${resourceInfo.category}"资源写一篇博客文章，避免版权风险，内容包含标题、摘要和正文。`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.generations[0].text;

    return {
      title: `${resourceInfo.category}资源精选合集`,
      excerpt: `高质量${resourceInfo.category}资源分享`,
      content: `# ${resourceInfo.category}资源分享\n\n${generatedText}`,
      tags: resourceInfo.tags,
      imagePrompt: `${resourceInfo.category.toLowerCase()} themed abstract art`
    };

  } catch (error) {
    console.error('Cohere生成失败:', error);
    return null;
  }
}

// 模板生成（备用）
function generateWithTemplate(resourceInfo: ResourceInfo): GeneratedContent {
  return {
    title: `精选${resourceInfo.category}资源合集`,
    excerpt: `为${resourceInfo.category}爱好者整理的高质量资源分享，包含${resourceInfo.tags.join('、')}等优质内容。`,
    content: `# ${resourceInfo.category}资源分享

## 🌟 资源特色
- **高质量内容**: 精心筛选，确保品质
- **分类清晰**: 便于查找和使用
- **定期更新**: 持续提供新鲜内容

## 📋 使用说明
建议根据个人需求选择合适的内容，合理使用资源。

## ⚖️ 免责声明
本站仅提供信息分享，不承担任何版权责任。请仅用于个人学习交流，支持正版内容。如有侵权，请联系删除。`,
    tags: [...resourceInfo.tags, '资源', '分享'],
    imagePrompt: 'abstract digital art, modern gradient colors'
  };
}

// 发布内容到Sanity
async function publishToSanity(content: GeneratedContent, resourceInfo: ResourceInfo) {
  try {
    const post = {
      _type: 'post',
      title: content.title,
      slug: {
        _type: 'slug',
        current: content.title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) + '-' + Date.now()
      },
      excerpt: content.excerpt,
      publishedAt: new Date().toISOString(),
      body: convertToBlockContent(content.content),
      // categories 和其他字段可以根据需要添加
    };

    const result = await sanityClient.create(post);
    return result;
  } catch (error) {
    console.error('发布到Sanity失败:', error);
    throw error;
  }
}

// 转换markdown到Sanity block content
function convertToBlockContent(markdown: string) {
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

// API路由处理器
export async function POST(request: NextRequest) {
  try {
    const { resource, generateOnly = false } = await request.json();

    if (!resource) {
      return NextResponse.json({ error: '缺少资源信息' }, { status: 400 });
    }

    console.log('开始生成内容:', resource.title);

    // 尝试不同的AI服务
    let generatedContent = await generateWithGemini(resource);

    if (!generatedContent) {
      console.log('Gemini失败，尝试Cohere...');
      generatedContent = await generateWithCohere(resource);
    }

    if (!generatedContent) {
      console.log('AI生成失败，使用模板...');
      generatedContent = generateWithTemplate(resource);
    }

    console.log('内容生成成功:', generatedContent.title);

    // 如果只是生成内容，不发布
    if (generateOnly) {
      return NextResponse.json({
        success: true,
        content: generatedContent,
        method: 'generated'
      });
    }

    // 发布到Sanity
    const publishedPost = await publishToSanity(generatedContent, resource);

    return NextResponse.json({
      success: true,
      content: generatedContent,
      published: publishedPost,
      method: 'published'
    });

  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({
      error: '生成失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// GET方法用于测试API状态
export async function GET() {
  return NextResponse.json({
    status: 'AI内容生成API正常运行',
    timestamp: new Date().toISOString(),
    apis: {
      gemini: !!process.env.GEMINI_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      sanity: !!process.env.SANITY_API_TOKEN
    }
  });
}