/**
 * 个人订阅号内容生成器 - 极简版
 * 无JavaScript,手动复制粘贴
 */

import { createClient } from '@sanity/client';
import ArticleConverter from './article-converter.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

const converter = new ArticleConverter(
  process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'
);

/**
 * 生成极简HTML(无JavaScript)
 */
function generateSimpleHTML(article) {
  const wechatArticle = converter.convertToWeChatArticle(article);

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${wechatArticle.title}</title>
  <style>
    body {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    .instructions {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions h3 {
      margin-top: 0;
      color: #1565c0;
      font-size: 20px;
    }
    .instructions ol {
      margin: 15px 0;
      padding-left: 25px;
      line-height: 1.8;
    }
    .instructions li {
      margin: 10px 0;
      color: #1976d2;
    }
    .instructions strong {
      color: #0d47a1;
    }
    .content-box {
      background: #fff;
      padding: 30px;
      border: 3px dashed #2196f3;
      border-radius: 8px;
      margin: 20px 0;
      position: relative;
    }
    .content-box::before {
      content: '👇 选择下方内容,Ctrl+C 复制 👇';
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background: #2196f3;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
    }
    .article-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 14px;
      color: #666;
    }
    .article-info div {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${wechatArticle.title}</div>
    </div>

    <div class="instructions">
      <h3>📋 使用步骤 (超简单!)</h3>
      <ol>
        <li><strong>用鼠标选中下方虚线框内的所有内容</strong> (从头拖到尾,或按 Ctrl+A)</li>
        <li><strong>按 Ctrl+C 复制</strong> (Mac用户按 Cmd+C)</li>
        <li><strong>打开公众号后台</strong>: <a href="https://mp.weixin.qq.com/" target="_blank">https://mp.weixin.qq.com/</a></li>
        <li><strong>新建图文消息</strong>,在编辑器中按 <strong>Ctrl+V 粘贴</strong></li>
        <li><strong>设置封面图和"阅读原文"链接</strong> (见下方信息)</li>
        <li><strong>预览检查,然后发布</strong>!</li>
      </ol>
    </div>

    <div class="article-info">
      <div><strong>📸 封面图:</strong> ${article.mainImage || '请自行上传封面图'}</div>
      <div><strong>🔗 阅读原文链接:</strong> ${converter.siteUrl}/posts/${article.slug}</div>
      <div><strong>👤 作者:</strong> ${wechatArticle.author}</div>
    </div>

    <!-- 可复制的内容区域 -->
    <div class="content-box" id="copyArea">
${wechatArticle.content}
    </div>

    <div class="instructions">
      <h3>✅ 复制成功后</h3>
      <ol>
        <li>在公众号编辑器中粘贴</li>
        <li>检查格式是否正确</li>
        <li>上传封面图</li>
        <li>设置"阅读原文"链接为: <strong>${converter.siteUrl}/posts/${article.slug}</strong></li>
        <li>发布!</li>
      </ol>
    </div>
  </div>
</body>
</html>
  `;
}

async function fetchArticles(limit = 1) {
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

  const articles = await sanityClient.fetch(query);
  return articles.map(article => ({
    ...article,
    slug: article.slug?.current || article.slug
  }));
}

async function saveAndOpen(html, filename) {
  const outputDir = path.join(__dirname, 'output-simple');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, html, 'utf8');

  console.log(`\n✅ 文件已保存: ${filePath}`);

  const command = process.platform === 'win32'
    ? `start "" "${filePath}"`
    : process.platform === 'darwin'
    ? `open "${filePath}"`
    : `xdg-open "${filePath}"`;

  exec(command, (error) => {
    if (!error) {
      console.log('✅ 已在浏览器中打开\n');
    }
  });

  return filePath;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 个人订阅号内容生成器 - 极简版');
  console.log('='.repeat(60));

  try {
    const args = process.argv.slice(2);
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 1;

    const articles = await fetchArticles(limit);

    if (articles.length === 0) {
      console.log('\n📭 没有找到文章');
      return;
    }

    console.log(`\n✅ 成功获取 ${articles.length} 篇文章`);

    const generatedFiles = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`\n[${i + 1}/${articles.length}] 处理: ${article.title}`);

      const html = generateSimpleHTML(article);
      const filename = `simple_${article.slug}_${Date.now()}.html`;
      const filePath = await saveAndOpen(html, filename);
      generatedFiles.push(filePath);

      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 生成完成!');
    console.log('='.repeat(60));
    console.log(`成功生成: ${articles.length} 篇`);
    console.log('\n📋 生成的文件:');
    generatedFiles.forEach(file => {
      console.log(`  • ${file}`);
    });

    console.log('\n💡 使用步骤:');
    console.log('  1. 在浏览器中选中虚线框内的所有内容');
    console.log('  2. 按 Ctrl+C 复制');
    console.log('  3. 在公众号后台按 Ctrl+V 粘贴');
    console.log('  4. 设置封面图和"阅读原文"链接');
    console.log('  5. 发布!\n');

  } catch (error) {
    console.error('\n❌ 生成失败:', error);
    process.exit(1);
  }
}

main();
