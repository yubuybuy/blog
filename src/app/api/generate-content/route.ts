// Vercel API路由 - 在服务器端生成AI内容
// 文件路径: src/app/api/generate-content/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { CURRENT_CONFIG, PROMPT_TEMPLATES } from '@/lib/generation-config';

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

// 智谱GLM AI生成（测试优化参数）
async function generateWithZhipu(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) return null;

  try {
    // 使用接地气模板
    const prompt = PROMPT_TEMPLATES.casual
      .replace('{category}', resourceInfo.category)
      .replace('{tags}', resourceInfo.tags.join(', '))
      .replace('{description}', resourceInfo.description || '暂无详细描述');

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: CURRENT_CONFIG.modelParams.gemini.temperature,
        max_tokens: CURRENT_CONFIG.modelParams.gemini.maxTokens,
        top_p: CURRENT_CONFIG.modelParams.gemini.topP
      })
    });

    if (!response.ok) {
      throw new Error(`智谱API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

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
    console.error('智谱生成失败:', error);
    return null;
  }
}

// Google Gemini AI生成（优化版）
async function generateWithGemini(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // 使用接地气模板并替换变量
    const prompt = PROMPT_TEMPLATES.casual
      .replace('{category}', resourceInfo.category)
      .replace('{tags}', resourceInfo.tags.join(', '))
      .replace('{description}', resourceInfo.description || '暂无详细描述');

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
        }],
        generationConfig: {
          temperature: CURRENT_CONFIG.modelParams.gemini.temperature,
          maxOutputTokens: CURRENT_CONFIG.modelParams.gemini.maxTokens,
          topP: CURRENT_CONFIG.modelParams.gemini.topP,
          topK: CURRENT_CONFIG.modelParams.gemini.topK
        }
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

// Cohere AI生成（优化版）
async function generateWithCohere(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) return null;

  try {
    // 使用接地气模板并替换变量
    const prompt = PROMPT_TEMPLATES.casual
      .replace('{category}', resourceInfo.category)
      .replace('{tags}', resourceInfo.tags.join(', '))
      .replace('{description}', resourceInfo.description || '暂无详细描述');

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CURRENT_CONFIG.modelParams.cohere.model,
        prompt: prompt,
        max_tokens: CURRENT_CONFIG.modelParams.cohere.maxTokens,
        temperature: CURRENT_CONFIG.modelParams.cohere.temperature,
        presence_penalty: CURRENT_CONFIG.modelParams.cohere.presencePenalty,
        frequency_penalty: CURRENT_CONFIG.modelParams.cohere.frequencyPenalty
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.generations[0].text;

    // Cohere不直接支持JSON输出，需要解析或构建结构化内容
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.log('Cohere JSON解析失败，使用结构化处理');
      }
    }

    // 如果没有JSON格式，构建结构化内容
    return {
      title: `${resourceInfo.category}资源精选合集`,
      excerpt: `高质量${resourceInfo.category}资源分享，包含${resourceInfo.tags.slice(0, 2).join('、')}等内容。`,
      content: `# ${resourceInfo.category}资源分享\n\n${generatedText}\n\n## 免责声明\n本站仅提供信息分享，请支持正版内容。`,
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

    // 优先尝试国内AI服务
    let generatedContent = await generateWithZhipu(resource);

    if (!generatedContent) {
      console.log('智谱失败，尝试Gemini...');
      generatedContent = await generateWithGemini(resource);
    }

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