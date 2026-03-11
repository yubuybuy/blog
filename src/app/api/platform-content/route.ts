/**
 * 多平台内容管理 API
 * GET  - 列出近期文章及其多平台内容状态
 * POST - 为已有文章补充生成多平台内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { authenticateRequest } from '@/lib/auth';
import { CURRENT_CONFIG, PROMPT_TEMPLATES } from '@/lib/generation-config';
import { convertToBlockContent } from '@/lib/markdown-to-blocks';

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

  const filter = request.nextUrl.searchParams.get('filter') || 'all';
  const pageSize = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 200);
  const offset = Math.max(Number(request.nextUrl.searchParams.get('offset')) || 0, 0);
  const postId = request.nextUrl.searchParams.get('postId');

  if (postId) {
    const post = await sanityClient.fetch(
      `*[_type == "post" && _id == $postId][0] {
        _id, title, excerpt, publishedAt,
        categories[]->{ title },
        downloadLink, markdownContent, platformContent
      }`,
      { postId }
    );
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  let filterClause = '';
  if (filter === 'missing') {
    filterClause = '&& (!defined(platformContent) || platformContent == null)';
  } else if (filter === 'has') {
    filterClause = '&& defined(platformContent) && platformContent != null';
  }

  // 先查总数
  const totalQuery = `count(*[_type == "post" ${filterClause}])`;
  const total = await sanityClient.fetch(totalQuery);

  const posts = await sanityClient.fetch(
    `*[_type == "post" ${filterClause}] | order(publishedAt desc) [$offset...$end] {
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
    { offset, end: offset + pageSize }
  );

  return NextResponse.json({ posts, total, offset, pageSize });
}

// POST - 为已有文章生成多平台内容
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // scope: 'platform' (仅4平台) | 'main' (仅主站) | 'all' (全部)
  const { postId, regenerate = false, scope = 'platform' } = await request.json();

  if (!postId) {
    return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
  }

  const post = await sanityClient.fetch(
    `*[_type == "post" && _id == $postId][0] {
      _id, title, excerpt,
      categories[]->{ title },
      downloadLink, markdownContent, platformContent
    }`,
    { postId }
  );

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  // 仅平台模式：已有内容且未要求重新生成 → 跳过
  if (scope === 'platform' && post.platformContent && !regenerate) {
    return NextResponse.json({
      success: true,
      skipped: true,
      message: '该文章已有多平台内容',
      platformContent: post.platformContent,
    });
  }

  const resourceInfo = {
    title: post.title,
    category: post.categories?.[0]?.title || '电影',
    tags: post.categories?.map((c: { title: string }) => c.title) || [],
    description: post.excerpt || '',
    downloadLink: post.downloadLink || '',
  };

  console.log(`[platform-content] 开始生成 (scope=${scope}):`, resourceInfo.title);

  const patchData: Record<string, unknown> = {};
  const responseData: Record<string, unknown> = { success: true, postId, title: post.title };

  // 生成主站内容
  if (scope === 'main' || scope === 'all') {
    const mainResult = await generateMainContent(resourceInfo, scope === 'all');
    if (!mainResult.success || !mainResult.data) {
      return NextResponse.json({
        error: `主站内容生成失败: ${mainResult.error}`,
      }, { status: 503 });
    }

    // 更新主站内容（保留原 title 和 slug 不变）
    patchData.markdownContent = mainResult.data.content;
    patchData.body = convertToBlockContent(mainResult.data.content);
    patchData.excerpt = mainResult.data.excerpt;
    responseData.mainContent = { excerpt: mainResult.data.excerpt, contentLength: mainResult.data.content.length };

    // 如果 scope=all，AI 同时返回了 platformContent
    if (scope === 'all' && mainResult.data.platformContent) {
      patchData.platformContent = mainResult.data.platformContent;
      responseData.platformContent = mainResult.data.platformContent;
    }
  }

  // 生成平台内容（仅 scope=platform 时单独生成）
  if (scope === 'platform') {
    const platResult = await generatePlatformOnly(resourceInfo);
    if (!platResult.success || !platResult.data) {
      return NextResponse.json({
        error: `平台内容生成失败: ${platResult.error}`,
        details: platResult.rawResponse?.substring(0, 500),
      }, { status: 503 });
    }
    patchData.platformContent = platResult.data;
    responseData.platformContent = platResult.data;
  }

  // 写入 Sanity
  if (Object.keys(patchData).length > 0) {
    await sanityClient.patch(postId).set(patchData).commit();
    console.log(`[platform-content] 保存成功 (scope=${scope}):`, resourceInfo.title);

    // 刷新网站缓存（主站内容变更时必须）
    if (scope === 'main' || scope === 'all') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'}/api/revalidate`, {
          method: 'POST'
        });
        console.log('[platform-content] 缓存刷新成功');
      } catch (e) {
        console.error('[platform-content] 缓存刷新失败:', e instanceof Error ? e.message : e);
      }
    }
  }

  return NextResponse.json(responseData);
}

interface GenerateResult {
  success: boolean;
  data?: Record<string, string>;
  error?: string;
  rawResponse?: string;
}

interface MainContentResult {
  success: boolean;
  data?: {
    content: string;
    excerpt: string;
    platformContent?: Record<string, string>;
  };
  error?: string;
}

// 生成主站内容（复用 movieReview / movieReviewMultiPlatform 模板）
async function generateMainContent(
  resourceInfo: { title: string; category: string; tags: string[]; description: string; downloadLink: string },
  includeMultiPlatform: boolean,
): Promise<MainContentResult> {
  const templateKey = includeMultiPlatform ? 'movieReviewMultiPlatform' : 'movieReview';
  const prompt = PROMPT_TEMPLATES[templateKey]
    .replace(/{title}/g, resourceInfo.title)
    .replace(/{category}/g, resourceInfo.category)
    .replace(/{tags}/g, resourceInfo.tags.join(', '))
    .replace(/{description}/g, resourceInfo.description || '暂无详细描述')
    .replace(/{downloadLink}/g, resourceInfo.downloadLink || '#');

  const multiplier = includeMultiPlatform ? CURRENT_CONFIG.modelParams.multiPlatformTokenMultiplier : 1;

  // 尝试 Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log('[main-content] 尝试 Gemini...');
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
              maxOutputTokens: CURRENT_CONFIG.modelParams.gemini.maxTokens * multiplier,
              topP: CURRENT_CONFIG.modelParams.gemini.topP,
              topK: CURRENT_CONFIG.modelParams.gemini.topK,
            },
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = extractMainJson(text);
          if (parsed) {
            console.log('[main-content] Gemini 解析成功');
            return { success: true, data: parsed };
          }
          console.error('[main-content] Gemini JSON 解析失败');
        }
      } else {
        console.error('[main-content] Gemini HTTP:', resp.status);
      }
    } catch (e) {
      console.error('[main-content] Gemini 异常:', e instanceof Error ? e.message : e);
    }
  }

  // 尝试 Cohere
  const cohereKey = process.env.COHERE_API_KEY;
  if (cohereKey) {
    console.log('[main-content] 尝试 Cohere...');
    try {
      const resp = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cohereKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CURRENT_CONFIG.modelParams.cohere.model,
          message: prompt,
          max_tokens: CURRENT_CONFIG.modelParams.cohere.maxTokens * multiplier,
          temperature: CURRENT_CONFIG.modelParams.cohere.temperature,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.text) {
          const parsed = extractMainJson(data.text);
          if (parsed) {
            console.log('[main-content] Cohere 解析成功');
            return { success: true, data: parsed };
          }
        }
      }
    } catch (e) {
      console.error('[main-content] Cohere 异常:', e instanceof Error ? e.message : e);
    }
  }

  return { success: false, error: '所有 AI 服务都不可用' };
}

// 从主站内容 AI 响应中提取 JSON
function extractMainJson(text: string): { content: string; excerpt: string; platformContent?: Record<string, string> } | null {
  if (!text) return null;

  const candidates: string[] = [];
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlock) candidates.push(codeBlock[1].trim());
  const rawMatch = text.match(/\{[\s\S]*\}/);
  if (rawMatch) candidates.push(rawMatch[0].trim());

  for (const candidate of candidates) {
    // 直接解析
    try {
      const parsed = JSON.parse(candidate);
      if (parsed.content && parsed.excerpt) return extractMainFields(parsed);
    } catch { /* 继续 */ }

    // 修复换行
    try {
      const fixed = fixJsonNewlines(candidate);
      const parsed = JSON.parse(fixed);
      if (parsed.content && parsed.excerpt) return extractMainFields(parsed);
    } catch { /* 继续 */ }
  }
  return null;
}

function extractMainFields(parsed: Record<string, unknown>): { content: string; excerpt: string; platformContent?: Record<string, string> } {
  const result: { content: string; excerpt: string; platformContent?: Record<string, string> } = {
    content: String(parsed.content || ''),
    excerpt: String(parsed.excerpt || ''),
  };
  if (parsed.platformContent && typeof parsed.platformContent === 'object') {
    const pc = parsed.platformContent as Record<string, unknown>;
    const valid: Record<string, string> = {};
    for (const k of ['zhihu', 'wechat', 'xiaohongshu', 'toutiao']) {
      if (typeof pc[k] === 'string' && (pc[k] as string).length > 20) {
        valid[k] = pc[k] as string;
      }
    }
    if (Object.keys(valid).length >= 2) result.platformContent = valid;
  }
  return result;
}

async function generatePlatformOnly(resourceInfo: {
  title: string;
  category: string;
  tags: string[];
  description: string;
  downloadLink: string;
}): Promise<GenerateResult> {
  const prompt = `你是一位专业影评人。请根据以下电影信息，为4个平台分别撰写推广文案。

电影信息：
- 电影名：${resourceInfo.title}
- 分类：${resourceInfo.category}
- 标签：${resourceInfo.tags.join(', ')}
- 描述：${resourceInfo.description || '暂无'}

要求：
- 每个版本使用不同的角度和措辞（不是截取或改写同一段）
- 保持核心事实一致（导演、演员、年份等）
- 每个版本末尾包含引流语："更多精彩影评和资源请访问 sswl.top"

### 知乎版（500-800字）
深度分析风格，专业影评人口吻。重点分析"为什么值得看"。

### 微信公众号版（300-500字）
个人体验风格，第一人称"我"叙述，带情感色彩。

### 小红书版（100-200字）
快速种草推荐风格。短句，可用emoji，结尾用 #话题标签 格式。

### 百家号/头条版（400-600字）
新闻资讯风格，客观中立，信息导向。

重要：请严格按以下JSON格式返回，不要添加任何额外文字。JSON字符串值内部的换行请用 \\n 表示：
\`\`\`json
{
  "zhihu": "知乎版完整内容",
  "wechat": "微信公众号版完整内容",
  "xiaohongshu": "小红书版完整内容",
  "toutiao": "百家号/头条版完整内容"
}
\`\`\``;

  // 尝试 Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log('[platform-content] 尝试 Gemini...');
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
              maxOutputTokens: CURRENT_CONFIG.modelParams.gemini.maxTokens * 2,
              topP: CURRENT_CONFIG.modelParams.gemini.topP,
              topK: CURRENT_CONFIG.modelParams.gemini.topK,
            },
          }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[platform-content] Gemini HTTP 错误:', resp.status, errText.substring(0, 300));
      } else {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('[platform-content] Gemini 原始响应长度:', text?.length || 0);

        if (text) {
          const parsed = extractPlatformJson(text);
          if (parsed) {
            console.log('[platform-content] Gemini JSON 解析成功');
            return { success: true, data: parsed };
          }
          console.error('[platform-content] Gemini JSON 解析失败，前300字:', text.substring(0, 300));
          // 继续尝试 Cohere
        }
      }
    } catch (e) {
      console.error('[platform-content] Gemini 异常:', e instanceof Error ? e.message : e);
    }
  } else {
    console.log('[platform-content] 无 Gemini API Key');
  }

  // 尝试 Cohere
  const cohereKey = process.env.COHERE_API_KEY;
  if (cohereKey) {
    console.log('[platform-content] 尝试 Cohere...');
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
          max_tokens: CURRENT_CONFIG.modelParams.cohere.maxTokens * 2,
          temperature: CURRENT_CONFIG.modelParams.cohere.temperature,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[platform-content] Cohere HTTP 错误:', resp.status, errText.substring(0, 300));
        return { success: false, error: `Cohere HTTP ${resp.status}` };
      }

      const data = await resp.json();
      const text = data.text;
      console.log('[platform-content] Cohere 原始响应长度:', text?.length || 0);

      if (text) {
        const parsed = extractPlatformJson(text);
        if (parsed) {
          console.log('[platform-content] Cohere JSON 解析成功');
          return { success: true, data: parsed };
        }
        console.error('[platform-content] Cohere JSON 解析失败，前300字:', text.substring(0, 300));
        return { success: false, error: 'JSON 解析失败', rawResponse: text };
      }
    } catch (e) {
      console.error('[platform-content] Cohere 异常:', e instanceof Error ? e.message : e);
      return { success: false, error: `Cohere 异常: ${e instanceof Error ? e.message : '未知'}` };
    }
  } else {
    console.log('[platform-content] 无 Cohere API Key');
  }

  return { success: false, error: '所有 AI 服务都不可用（检查 API Key 配置）' };
}

// 健壮的 JSON 解析 — 针对多平台内容结构
function extractPlatformJson(text: string): Record<string, string> | null {
  if (!text) return null;

  // 方法1: 提取 ```json 代码块
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonCandidate = codeBlock ? codeBlock[1].trim() : null;

  // 方法2: 直接匹配最外层 { ... }
  const rawMatch = text.match(/\{[\s\S]*\}/);
  const rawCandidate = rawMatch ? rawMatch[0].trim() : null;

  // 对每个候选尝试多种解析策略
  for (const candidate of [jsonCandidate, rawCandidate]) {
    if (!candidate) continue;

    // 策略1: 直接 parse（AI 返回了合法 JSON）
    try {
      const parsed = JSON.parse(candidate);
      if (isValidPlatformContent(parsed)) return parsed;
    } catch { /* 继续 */ }

    // 策略2: 修复 JSON 字符串值中的真实换行符
    // JSON 标准不允许字符串内有真实换行，需要替换为 \n
    try {
      const fixed = fixJsonNewlines(candidate);
      const parsed = JSON.parse(fixed);
      if (isValidPlatformContent(parsed)) return parsed;
    } catch { /* 继续 */ }

    // 策略3: 逐字段提取（最后手段）
    const extracted = extractFieldsManually(candidate);
    if (extracted && isValidPlatformContent(extracted)) return extracted;
  }

  return null;
}

// 修复 JSON 字符串值中的真实换行符
function fixJsonNewlines(jsonStr: string): string {
  // 逐字符扫描，只替换在引号内的换行符
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && ch === '\n') {
      result += '\\n';
      continue;
    }

    if (inString && ch === '\r') {
      continue; // 跳过 \r
    }

    result += ch;
  }

  return result;
}

// 逐字段手动提取
function extractFieldsManually(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {};
  const keys = ['zhihu', 'wechat', 'xiaohongshu', 'toutiao'];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    // 匹配 "key": "value" 或 "key": "value...直到下一个 key
    const pattern = nextKey
      ? new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,\\s*"${nextKey}")`)
      : new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*\\}`);

    const match = text.match(pattern);
    if (match) {
      fields[key] = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }

  return Object.keys(fields).length >= 2 ? fields : null;
}

function isValidPlatformContent(obj: unknown): obj is Record<string, string> {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  // 至少有2个平台有内容
  const validKeys = ['zhihu', 'wechat', 'xiaohongshu', 'toutiao'].filter(
    k => typeof o[k] === 'string' && (o[k] as string).length > 20
  );
  return validKeys.length >= 2;
}
