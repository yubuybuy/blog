/**
 * 多平台内容管理 API
 * GET  - 列出近期文章及其多平台内容状态
 * POST - 为已有文章补充生成多平台内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { authenticateRequest } from '@/lib/auth';
import { CURRENT_CONFIG, PROMPT_TEMPLATES } from '@/lib/generation-config';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
});

// GET - 列出近期文章
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const filter = request.nextUrl.searchParams.get('filter') || 'all'; // all | missing | has
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 100);
  const postId = request.nextUrl.searchParams.get('postId');

  // 获取单篇文章的 platformContent
  if (postId) {
    const post = await sanityClient.fetch(
      `*[_type == "post" && _id == $postId][0] {
        _id, title, excerpt, publishedAt,
        categories[]->{ title },
        downloadLink,
        markdownContent,
        platformContent
      }`,
      { postId }
    );
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  // 列出文章
  let filterClause = '';
  if (filter === 'missing') {
    filterClause = '&& (!defined(platformContent) || platformContent == null)';
  } else if (filter === 'has') {
    filterClause = '&& defined(platformContent) && platformContent != null';
  }

  const posts = await sanityClient.fetch(
    `*[_type == "post" ${filterClause}] | order(publishedAt desc) [0...$limit] {
      _id, title, excerpt, publishedAt,
      categories[]->{ title },
      downloadLink,
      "hasPlatformContent": defined(platformContent) && platformContent != null,
      "platforms": {
        "zhihu": defined(platformContent.zhihu) && platformContent.zhihu != null,
        "wechat": defined(platformContent.wechat) && platformContent.wechat != null,
        "xiaohongshu": defined(platformContent.xiaohongshu) && platformContent.xiaohongshu != null,
        "toutiao": defined(platformContent.toutiao) && platformContent.toutiao != null
      }
    }`,
    { limit }
  );

  return NextResponse.json({ posts });
}

// POST - 为已有文章生成多平台内容
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { postId, regenerate = false } = await request.json();

  if (!postId) {
    return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
  }

  // 获取文章信息
  const post = await sanityClient.fetch(
    `*[_type == "post" && _id == $postId][0] {
      _id, title, excerpt,
      categories[]->{ title },
      downloadLink,
      markdownContent,
      platformContent
    }`,
    { postId }
  );

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  // 已有内容且未要求重新生成
  if (post.platformContent && !regenerate) {
    return NextResponse.json({
      success: true,
      skipped: true,
      message: '该文章已有多平台内容，如需重新生成请设置 regenerate: true',
      platformContent: post.platformContent,
    });
  }

  // 构造资源信息
  const resourceInfo = {
    title: post.title,
    category: post.categories?.[0]?.title || '电影',
    tags: post.categories?.map((c: { title: string }) => c.title) || [],
    description: post.excerpt || '',
    downloadLink: post.downloadLink || '',
  };

  // 生成多平台内容（仅平台内容，用精简 prompt）
  const platformContent = await generatePlatformOnly(resourceInfo);

  if (!platformContent) {
    return NextResponse.json({ error: 'AI 生成失败，请稍后重试' }, { status: 503 });
  }

  // 存回 Sanity
  await sanityClient.patch(postId).set({ platformContent }).commit();

  return NextResponse.json({
    success: true,
    postId,
    title: post.title,
    platformContent,
  });
}

// 仅生成多平台内容的精简 prompt（不重新生成主站文章）
async function generatePlatformOnly(resourceInfo: {
  title: string;
  category: string;
  tags: string[];
  description: string;
  downloadLink: string;
}): Promise<Record<string, string> | null> {
  const prompt = `
你是一位专业影评人。请根据以下电影信息，为4个平台分别撰写推广文案。

电影信息：
- 电影名：${resourceInfo.title}
- 分类：${resourceInfo.category}
- 标签：${resourceInfo.tags.join(', ')}
- 描述：${resourceInfo.description || '暂无'}

要求：
- 每个版本使用不同的角度和措辞
- 保持核心事实一致
- 每个版本末尾包含引流语："更多精彩影评和资源请访问 sswl.top"

### 知乎版（500-800字）
深度分析风格，专业影评人口吻。重点分析"为什么值得看"。

### 微信公众号版（300-500字）
个人体验风格，第一人称"我"叙述，带情感色彩。

### 小红书版（100-200字）
快速种草推荐风格。短句，可用emoji，结尾用 #话题标签 格式。

### 百家号/头条版（400-600字）
新闻资讯风格，客观中立，信息导向。

请按 JSON 格式返回，换行用\\n：
{
  "zhihu": "知乎版内容",
  "wechat": "微信公众号版内容",
  "xiaohongshu": "小红书版内容",
  "toutiao": "百家号/头条版内容"
}`;

  // 先试 Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: CURRENT_CONFIG.modelParams.gemini.temperature,
              maxOutputTokens: CURRENT_CONFIG.modelParams.gemini.maxTokens,
              topP: CURRENT_CONFIG.modelParams.gemini.topP,
              topK: CURRENT_CONFIG.modelParams.gemini.topK,
            },
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = extractJson(text);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.error('Gemini platform-only 失败:', e);
    }
  }

  // 备选 Cohere
  const cohereKey = process.env.COHERE_API_KEY;
  if (cohereKey) {
    try {
      const resp = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cohereKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CURRENT_CONFIG.modelParams.cohere.model,
          message: prompt,
          max_tokens: CURRENT_CONFIG.modelParams.cohere.maxTokens,
          temperature: CURRENT_CONFIG.modelParams.cohere.temperature,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const parsed = extractJson(data.text);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.error('Cohere platform-only 失败:', e);
    }
  }

  return null;
}

// 从 AI 响应中提取 JSON
function extractJson(text: string): Record<string, string> | null {
  if (!text) return null;
  try {
    // 尝试代码块
    const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlock) {
      const cleaned = codeBlock[1].trim().replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      return JSON.parse(cleaned);
    }
    // 尝试直接匹配 JSON 对象
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}
