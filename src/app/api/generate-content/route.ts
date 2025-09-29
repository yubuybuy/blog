// Vercel API路由 - 在服务器端生成AI内容
// 文件路径: src/app/api/generate-content/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { CURRENT_CONFIG, PROMPT_TEMPLATES } from '@/lib/generation-config';
import { generateContentImage } from '@/lib/movie-poster';
import { processMoviePoster } from '@/lib/image-upload';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim() // 移除换行符和空格
});

// 根据分类名称查找分类ID
async function findCategoryByName(categoryName: string) {
  try {
    const categories = await sanityClient.fetch(`
      *[_type == "category" && title == $categoryName][0] {
        _id
      }
    `, { categoryName });

    if (categories) {
      return {
        _type: 'reference',
        _ref: categories._id
      };
    }

    console.log(`⚠️ 未找到分类: ${categoryName}`);
    return null;
  } catch (error) {
    console.error('查找分类失败:', error);
    return null;
  }
}

// 简单的速率限制 - 内存存储
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分钟
const MAX_REQUESTS = 5; // 每分钟最多5次请求

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];

  // 清理过期的请求记录
  const validRequests = userRequests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);

  if (validRequests.length >= MAX_REQUESTS) {
    return false; // 超出限制
  }

  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  return true; // 允许请求
}

// 验证请求来源和基本安全检查
function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  // 检查User-Agent，基本的bot检测
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, error: '无效的请求来源' };
  }

  // 检查Referer，确保请求来自合法域名
  const referer = request.headers.get('referer');
  const allowedDomains = ['www.sswl.top', 'localhost:3000', 'sswl.top'];

  if (referer) {
    const refererDomain = new URL(referer).hostname;
    if (!allowedDomains.includes(refererDomain)) {
      console.warn('⚠️ 可疑请求来源:', refererDomain);
    }
  }

  return { valid: true };
}

interface ResourceInfo {
  title: string;
  category: string;
  files: string[];
  tags: string[];
  description?: string;
  downloadLink?: string; // 新增网盘链接字段
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
}

// Google Gemini AI生成（优化版）
async function generateWithGemini(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Gemini API Key存在:', !!apiKey);
  if (!apiKey) return null;

  try {
    // 使用影评作者模板并替换变量
    const prompt = PROMPT_TEMPLATES.movieReview
      .replace('{title}', resourceInfo.title)
      .replace('{category}', resourceInfo.category)
      .replace('{tags}', resourceInfo.tags.join(', '))
      .replace('{description}', resourceInfo.description || '暂无详细描述')
      .replace('{downloadLink}', resourceInfo.downloadLink || '#');

    console.log('发送Gemini请求...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

    console.log('Gemini响应状态:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Gemini错误详情:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    console.log('Gemini原始响应:', text.substring(0, 500) + '...');

    // 尝试从markdown代码块中提取JSON（与Cohere使用完全相同的逻辑）
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        // 使用与Cohere完全相同的修复逻辑
        let jsonStr = codeBlockMatch[1]
          .trim()
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');

        const parsed = JSON.parse(jsonStr);
        console.log('Gemini从代码块解析JSON成功:', parsed.title);
        return parsed;
      } catch (parseError) {
        console.log('Gemini代码块JSON解析失败:', parseError);
        console.log('原始JSON前200字符:', codeBlockMatch[1].substring(0, 200));
        return null;
      }
    }

    // 如果所有解析都失败，返回null
    console.error('Gemini无法解析任何有效的JSON响应');
    return null;

  } catch (error) {
    console.error('Gemini生成失败:', error);
    console.error('错误详情:', error instanceof Error ? error.message : '未知错误');
    return null;
  }
}

// Cohere AI生成（优化版）
async function generateWithCohere(resourceInfo: ResourceInfo): Promise<GeneratedContent | null> {
  const apiKey = process.env.COHERE_API_KEY;
  console.log('Cohere API Key存在:', !!apiKey);
  if (!apiKey) return null;

  try {
    // 使用影评作者模板并替换变量
    const prompt = PROMPT_TEMPLATES.movieReview
      .replace('{title}', resourceInfo.title)
      .replace('{category}', resourceInfo.category)
      .replace('{tags}', resourceInfo.tags.join(', '))
      .replace('{description}', resourceInfo.description || '暂无详细描述')
      .replace('{downloadLink}', resourceInfo.downloadLink || '#');

    console.log('发送Cohere请求...');
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CURRENT_CONFIG.modelParams.cohere.model,
        message: prompt,
        max_tokens: CURRENT_CONFIG.modelParams.cohere.maxTokens,
        temperature: CURRENT_CONFIG.modelParams.cohere.temperature,
        presence_penalty: CURRENT_CONFIG.modelParams.cohere.presencePenalty,
        frequency_penalty: CURRENT_CONFIG.modelParams.cohere.frequencyPenalty
      })
    });

    console.log('Cohere响应状态:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Cohere错误详情:', errorText);
      throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.text; // Chat API返回格式不同

    console.log('Cohere原始响应:', generatedText.substring(0, 500) + '...');

    // 增强的JSON解析逻辑
    let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Cohere JSON解析成功:', parsed.title);
        return parsed;
      } catch (parseError) {
        console.log('Cohere JSON解析失败，使用结构化处理:', parseError);
      }
    }

    // 尝试从markdown代码块中提取JSON
    let codeBlockMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!codeBlockMatch) {
      // 如果没有完整的代码块，尝试匹配不完整的
      codeBlockMatch = generatedText.match(/```json\s*([\s\S]*?)$/);
    }

    if (codeBlockMatch) {
      try {
        // 最简单直接的方法：只替换换行符为\\n
        let jsonStr = codeBlockMatch[1]
          .trim()
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');

        const parsed = JSON.parse(jsonStr);
        console.log('Cohere JSON解析成功:', parsed.title);
        return parsed;

      } catch (parseError) {
        console.log('JSON解析失败:', parseError);
        console.log('原始JSON前200字符:', codeBlockMatch[1].substring(0, 200));
        return null;
      }
    }

    // 如果所有解析都失败，返回null
    console.error('Cohere无法解析任何有效的JSON响应');
    return null;

  } catch (error) {
    console.error('Cohere生成失败:', error);
    return null;
  }
}

// 处理图片插入 - 仅TMDB版本
async function processImagesInContent(content: string, resourceInfo: ResourceInfo): Promise<string> {
  console.log('=== 开始处理文章图片 ===');

  // 尝试获取TMDB图片
  const imageUrl = await generateContentImage(
    resourceInfo.title,
    resourceInfo.category,
    resourceInfo.tags,
    '电影海报风格'
  );

  console.log('获取到的图片URL:', imageUrl);

  if (imageUrl) {
    // 有图片则替换占位符
    let result = content.replace(/!\[([^\]]*)\]\(IMAGE_PLACEHOLDER\)/g, `![$1](${imageUrl})`);

    // 如果没有找到占位符，强制在内容开头插入图片
    if (!result.includes('![') && !content.includes('IMAGE_PLACEHOLDER')) {
      console.log('未找到图片占位符，强制插入TMDB图片');
      const imageMarkdown = `![电影海报](${imageUrl})\n\n`;
      result = imageMarkdown + result;
    }

    console.log('✅ 成功插入TMDB图片');
    return result;
  } else {
    console.log('⚠️ 未获取到TMDB图片，保持原内容');
    // 没有图片就保持原内容，不插入任何图片
    return content;
  }
}

// 修复无效网盘链接
function fixInvalidLinks(content: string, resourceInfo: ResourceInfo): string {
  // 检查是否有有效的网盘链接
  const hasValidLink = resourceInfo.downloadLink &&
    resourceInfo.downloadLink !== '#' &&
    resourceInfo.downloadLink.trim() !== '' &&
    (resourceInfo.downloadLink.includes('pan.baidu.com') ||
     resourceInfo.downloadLink.includes('aliyundrive.com') ||
     resourceInfo.downloadLink.includes('quark.cn') ||
     resourceInfo.downloadLink.includes('http'));

  if (!hasValidLink) {
    // 移除无效的下载链接
    content = content.replace(/\[([^\]]*获取[^\]]*资源[^\]]*)\]\([^)]*\)/g, '获取链接将在后续更新中提供，请关注本站');
    content = content.replace(/\[([^\]]*点击获取[^\]]*)\]\([^)]*\)/g, '资源链接待更新，敬请关注');
    content = content.replace(/\[([^\]]*下载链接[^\]]*)\]\([^)]*\)/g, '下载链接正在整理中');
  }

  return content;
}


// 发布内容到Sanity
async function publishToSanity(content: GeneratedContent, resourceInfo: ResourceInfo) {
  try {
    // 处理内容中的图片占位符
    let processedContent = await processImagesInContent(content.content, resourceInfo);

    // 修复无效的网盘链接
    processedContent = fixInvalidLinks(processedContent, resourceInfo);

    // 根据分类名称找到对应的分类ID
    const categoryRef = await findCategoryByName(resourceInfo.category);

    // 生成文章主图用于卡片显示 - 上传到Sanity
    const imageUrl = await generateContentImage(
      resourceInfo.title,
      resourceInfo.category,
      resourceInfo.tags,
      '文章封面'
    );

    console.log('获取到的TMDB图片URL:', imageUrl);

    // 将图片上传到Sanity（如果有的话）
    let mainImage = null;
    if (imageUrl) {
      console.log('🔄 正在上传图片到Sanity...');
      mainImage = await processMoviePoster(imageUrl, resourceInfo.title);
      console.log('图片处理结果:', mainImage ? '✅ 成功' : '❌ 失败');
    }

    console.log('关联的分类:', categoryRef ? `${resourceInfo.category} (ID: ${categoryRef._ref})` : '无分类');

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
      // 直接存储markdown内容而不是转换成blocks
      markdownContent: processedContent, // 新增字段存储原始markdown
      body: convertToBlockContent(processedContent), // 保留blocks作为备用
      // 添加必要的字段让文章能够显示
      author: null,
      categories: categoryRef ? [categoryRef] : [], // 关联到对应分类
      mainImage: mainImage, // 使用Sanity托管的图片
      // 保留URL字段作为备份（兼容性）
      mainImageUrl: imageUrl
    };

    const result = await sanityClient.create(post);

    // 发布成功后刷新缓存
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'}/api/revalidate`, {
        method: 'POST'
      });
      console.log('缓存刷新成功');
    } catch (cacheError) {
      console.log('缓存刷新失败，但文章已发布:', cacheError);
    }

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
    } else if (line.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: line.substring(4) }]
      });
    } else if (line.match(/!\[.*\]\(.*\)/)) {
      // 处理图片 - 存储为带图片URL的文本块
      const imageMatch = line.match(/!\[(.*)\]\((.*)\)/);
      if (imageMatch) {
        blocks.push({
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{
            _type: 'span',
            text: `![${imageMatch[1]}](${imageMatch[2]})`,
            marks: [] // 简化处理，在前端直接解析markdown
          }]
        });
      }
    } else if (line.trim()) {
      // 处理包含链接的普通文本
      const children = parseInlineMarkdown(line);
      blocks.push({
        _type: 'block',
        style: 'normal',
        children: children
      });
    }
  }

  return blocks;
}

// 解析行内markdown（粗体、链接等）
function parseInlineMarkdown(text: string) {
  const children = [];
  let currentText = text;

  // 简单处理，可以进一步优化
  if (currentText.includes('**') || currentText.includes('[')) {
    // 复杂文本处理 - 这里简化处理
    children.push({ _type: 'span', text: currentText });
  } else {
    children.push({ _type: 'span', text: currentText });
  }

  return children;
}

// API路由处理器
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 获取客户端IP
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0] || request.ip || 'unknown';

    console.log('🔐 AI生成请求 - IP:', clientIp);

    // 1. 验证请求来源
    const validation = validateRequest(request);
    if (!validation.valid) {
      console.warn('❌ 请求验证失败:', validation.error, '- IP:', clientIp);
      return NextResponse.json({
        error: '请求被拒绝',
        details: validation.error
      }, { status: 403 });
    }

    // 2. 速率限制检查
    if (!checkRateLimit(clientIp)) {
      console.warn('❌ 速率限制 - IP:', clientIp);
      return NextResponse.json({
        error: '请求过于频繁，请稍后再试',
        details: `每分钟最多允许${MAX_REQUESTS}次请求`
      }, { status: 429 });
    }

    const { resource, generateOnly = false, publishPregenerated = false, content } = await request.json();

    if (!resource) {
      return NextResponse.json({ error: '缺少资源信息' }, { status: 400 });
    }

    // 3. 输入验证和清理
    if (!resource.title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    if (!resource.downloadLink?.trim()) {
      console.warn('⚠️ 未提供网盘链接 - IP:', clientIp);
    }

    // 4. 清理输入数据，防止注入
    const cleanResource = {
      title: resource.title.trim().slice(0, 100), // 限制长度
      category: resource.category?.trim().slice(0, 20) || '其他',
      tags: Array.isArray(resource.tags) ? resource.tags.slice(0, 10) : [],
      description: resource.description?.trim().slice(0, 500) || '',
      downloadLink: resource.downloadLink?.trim().slice(0, 200) || ''
    };

    console.log('✅ 安全检查通过，开始生成内容:', cleanResource.title);

    let generatedContent;
    let aiMethod = 'unknown';

    // 如果是发布预生成内容，直接使用提供的内容
    if (publishPregenerated && content) {
      console.log('📝 使用预生成内容进行发布');
      generatedContent = content;
      aiMethod = 'pregenerated';
    } else {
      // 正常AI生成流程
      // 先尝试Gemini，失败后使用Cohere作为备选
      generatedContent = await generateWithGemini(cleanResource);
      aiMethod = 'gemini';

      if (!generatedContent) {
        console.log('Gemini失败，尝试Cohere备选 - IP:', clientIp);
        generatedContent = await generateWithCohere(cleanResource);
        aiMethod = 'cohere';
      }

      if (!generatedContent) {
        console.log('所有AI服务都失败 - IP:', clientIp);
        return NextResponse.json({
          error: 'AI服务暂时不可用，请检查网络连接或稍后重试',
          details: '所有AI API都无法访问'
        }, { status: 503 });
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ 内容生成成功 - 用时: ${processingTime}ms`);

    // 如果只是生成内容，不发布
    if (generateOnly) {
      return NextResponse.json({
        success: true,
        content: generatedContent,
        method: aiMethod,
        processingTime: processingTime
      });
    }

    // 发布到Sanity
    const publishedPost = await publishToSanity(generatedContent, cleanResource);

    console.log(`🚀 内容发布成功 - 总用时: ${Date.now() - startTime}ms - 使用AI: ${aiMethod}`);

    return NextResponse.json({
      success: true,
      content: generatedContent,
      published: publishedPost,
      method: aiMethod,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ API错误:', error);

    // 记录可疑活动
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0] || request.ip || 'unknown';
    console.error('错误发生 - IP:', clientIp, 'Error:', error);

    return NextResponse.json({
      error: '服务器内部错误',
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
      sanity: !!process.env.SANITY_API_TOKEN,
      tmdb: !!process.env.TMDB_API_KEY
    }
  });
}