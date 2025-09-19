#!/usr/bin/env node

// 清理并重新发布正确文章的脚本
import { createClient } from '@sanity/client';
import fs from 'fs';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function cleanAndRepublish() {
  console.log('🧹 开始清理并重新发布...\n');

  try {
    // 1. 清理现有文章
    console.log('🗑️ 清理现有文章...');
    const posts = await sanityClient.fetch('*[_type == "post"]');
    console.log(`找到 ${posts.length} 篇文章需要清理`);

    for (const post of posts) {
      await sanityClient.delete(post._id);
      console.log(`✅ 已删除: "${post.title}"`);
    }

    // 2. 清理发布记录
    console.log('\n🧹 清理发布记录...');
    if (fs.existsSync('./processed/published-titles.txt')) {
      fs.writeFileSync('./processed/published-titles.txt', '');
      console.log('✅ 发布记录已清理');
    }

    // 3. 修复分类slug
    console.log('\n🔧 修复分类slug...');
    const categories = await sanityClient.fetch('*[_type == "category"]');
    const categoryMap = {
      '电影': 'movies',
      '软件': 'software',
      '教育': 'education',
      '游戏': 'games',
      '音乐': 'music',
      '图书': 'books'
    };

    for (const category of categories) {
      const newSlug = categoryMap[category.title] || category.title
        .toLowerCase()
        .replace(/[^\\w\\s-]/g, '')
        .replace(/\\s+/g, '-');

      if (category.slug?.current !== newSlug) {
        await sanityClient
          .patch(category._id)
          .set({
            slug: {
              _type: 'slug',
              current: newSlug
            }
          })
          .commit();
        console.log(`✅ 分类 "${category.title}" slug已更新为: ${newSlug}`);
      }
    }

    console.log('\n✅ 清理和修复完成！');
    console.log('💡 现在可以重新运行发布器来创建正确的文章。');

  } catch (error) {
    console.error('❌ 清理过程失败:', error.message);
    throw error;
  }
}

cleanAndRepublish().catch((error) => {
  console.error('🚨 清理失败:', error.message);
  process.exit(1);
});