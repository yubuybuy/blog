#!/usr/bin/env node

// 清理现有文章的脚本
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function cleanupArticles() {
  console.log('🧹 开始清理现有文章...\n');

  try {
    // 获取所有文章
    const posts = await sanityClient.fetch('*[_type == "post"]');
    console.log(`📊 找到 ${posts.length} 篇文章`);

    if (posts.length === 0) {
      console.log('✅ 没有文章需要清理');
      return;
    }

    // 逐个删除
    for (const post of posts) {
      try {
        await sanityClient.delete(post._id);
        console.log(`🗑️ 已删除: "${post.title}"`);
      } catch (error) {
        console.error(`❌ 删除失败: "${post.title}"`, error.message);
      }
    }

    console.log('\n✅ 文章清理完成！');

    // 清理已发布记录
    console.log('🧹 清理发布记录...');
    import fs from 'fs';

    if (fs.existsSync('./processed/published-titles.txt')) {
      fs.writeFileSync('./processed/published-titles.txt', '');
      console.log('✅ 已清理发布记录');
    }

  } catch (error) {
    console.error('🚨 清理过程出错:', error.message);
    throw error;
  }
}

cleanupArticles().catch((error) => {
  console.error('🚨 清理失败:', error.message);
  process.exit(1);
});