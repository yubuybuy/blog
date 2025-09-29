import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01'
});

try {
  const posts = await client.fetch(`
    *[_type == "post"] | order(_createdAt desc)[0...2] {
      title,
      mainImage,
      mainImageUrl,
      markdownContent,
      _createdAt,
      _id
    }
  `);

  console.log('最新的2篇文章:');
  posts.forEach((post, index) => {
    console.log(`\n=== 文章 ${index + 1} ===`);
    console.log(`ID: ${post._id}`);
    console.log(`标题: ${post.title}`);
    console.log(`创建时间: ${post._createdAt}`);

    // 检查图片存储
    if (post.mainImage) {
      console.log(`Sanity图片: ✅`);
      console.log(`图片ID: ${post.mainImage.asset?._ref || 'N/A'}`);
      console.log(`图片Alt: ${post.mainImage.alt || 'N/A'}`);
      if (post.mainImage.customUrl) {
        console.log(`原始TMDB URL: ${post.mainImage.customUrl}`);
      }
    } else {
      console.log(`Sanity图片: ❌`);
    }

    if (post.mainImageUrl) {
      console.log(`备用URL: ${post.mainImageUrl}`);
    } else {
      console.log(`备用URL: ❌`);
    }

    // 检查内容中的图片
    if (post.markdownContent) {
      const imageMatches = post.markdownContent.match(/!\[.*?\]\(.*?\)/g);
      if (imageMatches) {
        console.log(`内容中的图片数量: ${imageMatches.length}`);
        imageMatches.forEach((img, i) => {
          console.log(`  图片${i+1}: ${img.substring(0, 100)}...`);
        });
      } else {
        console.log(`内容中的图片: 无`);
      }
    }
  });
} catch (error) {
  console.error('查询失败:', error.message);
}