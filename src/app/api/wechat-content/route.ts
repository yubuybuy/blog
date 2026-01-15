/**
 * API: 获取文章列表并转换为公众号格式
 * /api/wechat-content
 */

import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// 文章格式转换类
class ArticleConverter {
  siteUrl: string;

  constructor(siteUrl: string) {
    this.siteUrl = siteUrl;
  }

  convertToWeChatArticle(article: {
    title: string;
    excerpt?: string;
    content?: string;
    mainImage?: string;
    slug: string;
    author?: { name: string };
  }) {
    const { title, excerpt, content, mainImage, slug } = article;
    const articleUrl = `${this.siteUrl}/posts/${slug}`;
    const convertedContent = this.convertContent(content || '', articleUrl);

    return {
      title: this.optimizeTitle(title),
      author: article.author?.name || 'AI小白',
      excerpt: this.optimizeExcerpt(excerpt || '', articleUrl),
      content: convertedContent,
      articleUrl,
      mainImage: mainImage || '',
      slug
    };
  }

  optimizeTitle(title: string) {
    if (title.length > 64) {
      return title.substring(0, 61) + '...';
    }
    return title;
  }

  optimizeExcerpt(excerpt: string, articleUrl: string) {
    const trafficHint = `\n\n🔗 点击阅读原文获取网盘资源链接`;
    const maxLength = 120 - trafficHint.length;
    let optimizedExcerpt = excerpt || '';

    if (optimizedExcerpt.length > maxLength) {
      optimizedExcerpt = optimizedExcerpt.substring(0, maxLength - 3) + '...';
    }

    return optimizedExcerpt + trafficHint;
  }

  convertContent(content: string, articleUrl: string) {
    let html = `<div style="font-size: 16px; line-height: 1.8; color: #333;">`;

    html += this.markdownToHtml(content || '');
    html += this.buildResourceSection(articleUrl);
    html += this.buildFooter(articleUrl);
    html += `</div>`;

    return html;
  }

  markdownToHtml(markdown: string) {
    if (!markdown) return '';

    let html = markdown;

    // 标题转换
    html = html.replace(/^### (.*$)/gim, '<h3 style="color: #2c3e50; margin: 20px 0 10px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="color: #2c3e50; margin: 25px 0 15px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="color: #2c3e50; margin: 30px 0 20px;">$1</h1>');

    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 列表
    html = html.replace(/^\* (.*$)/gim, '<li style="margin: 5px 0;">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li style="margin: 5px 0;">$1</li>');

    // 段落
    html = html.split('\n\n').map(para => {
      if (para.startsWith('<h') || para.startsWith('<li')) {
        return para;
      }
      return `<p style="margin: 15px 0; text-align: justify;">${para}</p>`;
    }).join('\n');

    return html;
  }

  buildResourceSection(articleUrl: string) {
    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 20px;
                  border-radius: 10px;
                  margin: 30px 0;
                  text-align: center;">
        <h3 style="color: white; margin-bottom: 15px;">📦 如何获取资源?</h3>
        <p style="color: #f0f0f0; font-size: 15px; line-height: 1.6;">
          本文涉及的所有网盘资源链接,<br/>
          请访问我们的网站获取完整信息
        </p>
        <div style="background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;">
          <p style="color: #667eea; font-weight: bold; font-size: 14px; margin: 0;">
            👉 点击【阅读原文】即可查看所有资源链接 👈
          </p>
        </div>
      </div>
    `;
  }

  buildFooter(articleUrl: string) {
    return `
      <div style="border-top: 2px solid #e0e0e0;
                  margin-top: 40px;
                  padding-top: 20px;
                  text-align: center;">
        <p style="color: #888; font-size: 14px;">
          ⭐ 更多优质资源,请访问我们的网站
        </p>
        <p style="color: #667eea;
                  font-weight: bold;
                  font-size: 16px;
                  margin: 10px 0;">
          ${this.siteUrl}
        </p>
        <p style="color: #999; font-size: 13px; margin-top: 15px;">
          💡 资源持续更新,建议收藏本站
        </p>
      </div>

      <div style="background: #f8f9fa;
                  padding: 15px;
                  border-radius: 8px;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #666;">
        <p style="margin: 5px 0;">⚠️ 免责声明</p>
        <p style="margin: 5px 0; line-height: 1.5;">
          本站仅提供资源信息分享,不存储任何文件。所有资源均来源于网络,仅供学习交流使用。
          如有版权问题,请联系我们删除。
        </p>
      </div>
    `;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // 获取文章列表
    const query = `
      *[_type == "post"] | order(publishedAt desc) [0...${limit}] {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        "author": author->{name},
        "mainImage": mainImage.asset->url,
        "content": pt::text(body)
      }
    `;

    const articles = await sanityClient.fetch(query);

    // 转换为公众号格式
    const converter = new ArticleConverter(
      process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'
    );

    const wechatArticles = articles.map((article: {
      slug?: { current: string } | string;
      title: string;
      excerpt?: string;
      content?: string;
      mainImage?: string;
      author?: { name: string };
      [key: string]: unknown;
    }) => {
      const slug = typeof article.slug === 'object' && article.slug?.current ? article.slug.current : String(article.slug || '');
      return converter.convertToWeChatArticle({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        mainImage: article.mainImage,
        author: article.author,
        slug
      });
    });

    return NextResponse.json({
      success: true,
      data: wechatArticles
    });
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取文章失败'
      },
      { status: 500 }
    );
  }
}
