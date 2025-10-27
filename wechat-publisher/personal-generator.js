/**
 * 个人订阅号内容生成器
 * 专为无法使用API的个人订阅号设计
 * 自动生成格式化内容,一键复制到公众号后台
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

// Sanity客户端配置
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
 * 从Sanity获取文章
 */
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

/**
 * 生成公众号编辑器格式的HTML
 */
function generateWeChatHTML(article) {
  const wechatArticle = converter.convertToWeChatArticle(article);

  // 生成完整的HTML页面
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
    .meta {
      color: #999;
      font-size: 14px;
    }
    .copy-btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .copy-btn:hover {
      transform: scale(1.05);
    }
    .copy-btn:active {
      transform: scale(0.95);
    }
    .success-msg {
      display: none;
      background: #4caf50;
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
    }
    .instructions {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions h3 {
      margin-top: 0;
      color: #856404;
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
      color: #856404;
    }
    .content-preview {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 2px dashed #ddd;
    }
    .hidden-content {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${wechatArticle.title}</div>
      <div class="meta">作者: ${wechatArticle.author} | 准备发布到公众号</div>
    </div>

    <div class="instructions">
      <h3>📋 使用步骤 (只需15秒)</h3>
      <ol>
        <li><strong>点击下方"一键复制内容"按钮</strong></li>
        <li><strong>登录公众号后台</strong>: <a href="https://mp.weixin.qq.com/" target="_blank">https://mp.weixin.qq.com/</a></li>
        <li><strong>新建图文消息</strong>,粘贴标题和内容</li>
        <li><strong>设置封面图</strong>: ${article.mainImage || '请自行上传'}</li>
        <li><strong>预���检查</strong>,没问题就发布!</li>
      </ol>
    </div>

    <div style="text-align: center;">
      <button class="copy-btn" onclick="copyContent()">
        📋 一键复制内容 (Ctrl+C)
      </button>
    </div>

    <div id="successMsg" class="success-msg">
      ✅ 内容已复制到剪贴板! 现在可以粘贴到公众号后台了
    </div>

    <div class="content-preview">
      <h3>📄 内容预览</h3>
      <div style="max-height: 400px; overflow-y: auto; padding: 15px; background: white; border-radius: 4px;">
        ${wechatArticle.content}
      </div>
    </div>

    <!-- 隐藏的纯文本内容,用于复制 -->
    <textarea id="hiddenContent" class="hidden-content">${wechatArticle.title}

${wechatArticle.digest}

${stripHtmlTags(wechatArticle.content)}</textarea>

    <!-- 隐藏的HTML内容 -->
    <div id="htmlContent" class="hidden-content">${wechatArticle.content}</div>
  </div>

  <script>
    function copyContent() {
      try {
        // 简化方案: 只复制HTML内容
        const htmlContent = document.getElementById('htmlContent');
        const textarea = document.getElementById('hiddenContent');

        // 创建临时元素用于选择
        const range = document.createRange();
        range.selectNode(htmlContent);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        // 尝试复制
        let success = false;
        try {
          success = document.execCommand('copy');
        } catch (err) {
          console.log('execCommand failed, trying textarea');
        }

        // 如果失败,使用textarea降级方案
        if (!success) {
          textarea.style.display = 'block';
          textarea.select();
          document.execCommand('copy');
          textarea.style.display = 'none';
        }

        // 清除选择
        window.getSelection().removeAllRanges();

        // 显示成功消息
        showSuccess();
      } catch (err) {
        console.error('Copy failed:', err);
        alert('复制失败,请手动选择内容复制(Ctrl+A, Ctrl+C)');
      }
    }

    function showSuccess() {
      const msg = document.getElementById('successMsg');
      msg.style.display = 'block';
      setTimeout(() => {
        msg.style.display = 'none';
      }, 5000);
    }
  </script>
</body>
</html>
  `;
}

/**
 * 移除HTML标签
 */
function stripHtmlTags(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * 生成Markdown格式(备用方案)
 */
function generateMarkdown(article) {
  const wechatArticle = converter.convertToWeChatArticle(article);

  return `# ${wechatArticle.title}

> 作者: ${wechatArticle.author}
> 导流链接: ${converter.siteUrl}/posts/${article.slug}

---

## 摘要

${wechatArticle.digest}

---

## 正文

${article.content}

---

## 📦 如何获取资源?

本文涉及的所有网盘资源链接,请访问我们的网站获取完整信息

👉 **点击【阅读原文】即可查看所有资源链接** 👈

网站地址: ${converter.siteUrl}

---

## ⚠️ 免责声明

本站仅提供资源信息分享,不存储任何文件。所有资源均来源于网络,仅供学习交流使用。如有版权问题,请联系我们删除。

---

💡 更多优质资源,请访问: ${converter.siteUrl}
`;
}

/**
 * 保存并打开HTML文件
 */
async function saveAndOpen(html, filename) {
  const outputDir = path.join(__dirname, 'output');

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, html, 'utf8');

  console.log(`\n✅ 文件已保存: ${filePath}`);

  // 自动在浏览器中打开
  const command = process.platform === 'win32'
    ? `start "" "${filePath}"`
    : process.platform === 'darwin'
    ? `open "${filePath}"`
    : `xdg-open "${filePath}"`;

  exec(command, (error) => {
    if (error) {
      console.log('\n请手动打开文件:', filePath);
    } else {
      console.log('✅ 已在浏览器中打开\n');
    }
  });

  return filePath;
}

/**
 * 生成使用报告
 */
function generateReport(articles) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 内容生成报告');
  console.log('='.repeat(60));
  console.log(`成功生成: ${articles.length} 篇`);
  console.log('\n文章列表:');
  articles.forEach((article, index) => {
    console.log(`  ${index + 1}. ${article.title}`);
  });
  console.log('='.repeat(60));
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 个人订阅号内容生成器');
  console.log('='.repeat(60));

  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 1;
    const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'html';

    // 获取文章
    const articles = await fetchArticles(limit);

    if (articles.length === 0) {
      console.log('\n📭 没有找到文章');
      return;
    }

    console.log(`\n✅ 成功获取 ${articles.length} 篇文章`);

    // 生成内容
    const generatedFiles = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`\n[${i + 1}/${articles.length}] 处理: ${article.title}`);

      if (format === 'html') {
        // 生成HTML格式
        const html = generateWeChatHTML(article);
        const filename = `wechat_${article.slug}_${Date.now()}.html`;
        const filePath = await saveAndOpen(html, filename);
        generatedFiles.push(filePath);
      } else if (format === 'markdown') {
        // 生成Markdown格式
        const markdown = generateMarkdown(article);
        const filename = `wechat_${article.slug}_${Date.now()}.md`;
        const outputDir = path.join(__dirname, 'output');

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, markdown, 'utf8');
        console.log(`✅ 已保存: ${filePath}`);
        generatedFiles.push(filePath);
      }

      // 如果有多篇文章,稍等一下
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 生成报告
    generateReport(articles);

    console.log('\n📋 生成的文件:');
    generatedFiles.forEach(file => {
      console.log(`  • ${file}`);
    });

    console.log('\n💡 下一步:');
    console.log('  1. 在打开的浏览器页面中点击"一键复制内容"');
    console.log('  2. 登录公众号后台: https://mp.weixin.qq.com/');
    console.log('  3. 新建图文消息,粘贴内容');
    console.log('  4. 设置封面图并发布\n');

  } catch (error) {
    console.error('\n❌ 生成失败:', error);
    process.exit(1);
  }
}

// 命令行帮助
if (process.argv.includes('--help')) {
  console.log(`
个人订阅号内容生成器

使用方式:
  node wechat-publisher/personal-generator.js [选项]

选项:
  --limit=N         生成数量(默认1篇)
  --format=FORMAT   输出格式: html 或 markdown (默认html)
  --help            显示帮助

示例:
  # 生成1篇HTML格式
  node wechat-publisher/personal-generator.js

  # 生成3篇文章
  node wechat-publisher/personal-generator.js --limit=3

  # 生成Markdown格式
  node wechat-publisher/personal-generator.js --format=markdown
  `);
  process.exit(0);
}

main();
