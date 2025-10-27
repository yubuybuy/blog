/**
 * 将Sanity博客文章同步到微信公众号
 * 使用方式: node wechat-publisher/sync-to-wechat.js
 */

import { createClient } from '@sanity/client';
import WeChatPublisher from './wechat-publisher.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Sanity客户端配置
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// 微信公众号配置
const wechatConfig = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'
};

// 验证配置
function validateConfig() {
  const errors = [];

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    errors.push('缺少 NEXT_PUBLIC_SANITY_PROJECT_ID');
  }
  if (!process.env.WECHAT_APP_ID) {
    errors.push('缺少 WECHAT_APP_ID');
  }
  if (!process.env.WECHAT_APP_SECRET) {
    errors.push('缺少 WECHAT_APP_SECRET');
  }

  if (errors.length > 0) {
    console.error('配置错误:');
    errors.forEach(err => console.error(`  ❌ ${err}`));
    console.error('\n请在 .env.local 文件中配置以上环境变量');
    process.exit(1);
  }

  console.log('✅ 配置验证通过');
}

/**
 * 从Sanity获取待发布的文章
 * @param {number} limit - 获取数量限制
 * @returns {Array} 文章列表
 */
async function fetchArticlesFromSanity(limit = 5) {
  console.log(`\n正在从 Sanity 获取最新 ${limit} 篇文章...`);

  const query = `
    *[_type == "post"] | order(publishedAt desc) [0...${limit}] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      "author": author->{name},
      "mainImage": mainImage.asset->url,
      "content": pt::text(body),
      "netdiskLinks": netdiskLinks
    }
  `;

  try {
    const articles = await sanityClient.fetch(query);
    console.log(`✅ 成功获取 ${articles.length} 篇文章`);

    return articles.map(article => ({
      ...article,
      slug: article.slug?.current || article.slug
    }));
  } catch (error) {
    console.error('❌ 获取文章失败:', error);
    throw error;
  }
}

/**
 * 检查文章是否已发布到公众号
 * @param {string} articleId - 文章ID
 * @returns {boolean}
 */
async function isArticlePublished(articleId) {
  // 可以在Sanity中添加一个字段来追踪是否已发布到公众号
  // 这里简化处理,可以通过日志文件判断
  return false;
}

/**
 * 标记文章为已发布
 * @param {string} articleId - 文章ID
 * @param {string} mediaId - 微信media_id
 */
async function markAsPublished(articleId, mediaId) {
  try {
    // 可以在Sanity中更新文章状态
    await sanityClient
      .patch(articleId)
      .set({
        wechatPublished: true,
        wechatMediaId: mediaId,
        wechatPublishedAt: new Date().toISOString()
      })
      .commit();

    console.log(`✅ 已标记文章为已发布: ${articleId}`);
  } catch (error) {
    console.warn('标记文章状态失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Sanity博客 → 微信公众号同步工具');
  console.log('='.repeat(60));

  // 验证配置
  validateConfig();

  try {
    // 获取文章
    const articles = await fetchArticlesFromSanity(5);

    if (articles.length === 0) {
      console.log('📭 没有找到可发布的文章');
      return;
    }

    // 创建发布器
    const publisher = new WeChatPublisher(wechatConfig);

    // 解析命令行参数
    const args = process.argv.slice(2);
    const autoPublish = args.includes('--auto-publish');
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 1;

    console.log(`\n发布模式: ${autoPublish ? '自动发布' : '仅创建草稿'}`);
    console.log(`发布数量: ${limit} 篇\n`);

    // 批量发布
    const results = await publisher.batchPublish(articles.slice(0, limit), {
      autoPublish,
      interval: 60000, // 1分钟间隔
      limit
    });

    // 标记已发布的文章
    for (const result of results) {
      if (result.success && result.mediaId) {
        const article = articles.find(a => a.title === result.article);
        if (article) {
          await markAsPublished(article._id, result.mediaId);
        }
      }
    }

    console.log('\n✨ 同步完成!');

  } catch (error) {
    console.error('\n❌ 同步失��:', error);
    process.exit(1);
  }
}

// 命令行帮助
if (process.argv.includes('--help')) {
  console.log(`
使用说明:
  node wechat-publisher/sync-to-wechat.js [选项]

选项:
  --auto-publish    自动发布到公众号(默认仅创建草稿)
  --limit=N         发布数量限制(默认1篇)
  --help            显示帮助信息

示例:
  # 仅创建1篇草稿
  node wechat-publisher/sync-to-wechat.js

  # 自动发布3篇文章
  node wechat-publisher/sync-to-wechat.js --auto-publish --limit=3

  # 仅创建5篇草稿
  node wechat-publisher/sync-to-wechat.js --limit=5
  `);
  process.exit(0);
}

// 运行主函数
main();
