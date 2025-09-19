#!/usr/bin/env node

// 清理所有文章并重新开始
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function cleanupAndRestart() {
  console.log('🧹 开始清理现有文章...\n');

  try {
    // 1. 获取所有文章
    console.log('📊 查询所有现有文章...');
    const allPosts = await sanityClient.fetch('*[_type == "post"]');
    console.log(`找到 ${allPosts.length} 篇文章`);

    // 2. 删除所有文章
    if (allPosts.length > 0) {
      console.log('🗑️ 删除所有文章...');
      for (const post of allPosts) {
        try {
          await sanityClient.delete(post._id);
          console.log(`✅ 删除: ${post.title}`);
        } catch (error) {
          console.error(`❌ 删除失败: ${post.title}`, error.message);
        }
      }
    }

    // 3. 清理已发布记录
    console.log('\n📝 清理发布记录...');
    try {
      const fs = await import('fs');
      const publishedFile = './processed/published-titles.txt';
      if (fs.existsSync(publishedFile)) {
        fs.unlinkSync(publishedFile);
        console.log('✅ 已发布记录已清空');
      }
    } catch (error) {
      console.log('ℹ️ 没有找到发布记录文件');
    }

    // 4. 显示当前resources.json内容
    console.log('\n📋 当前待发布资源:');
    try {
      const fs = await import('fs');
      const resourcesContent = fs.readFileSync('./resources.json', 'utf-8');
      const resources = JSON.parse(resourcesContent);

      resources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.title} (${resource.category})`);
        console.log(`   描述: ${resource.description?.substring(0, 100)}...`);
        console.log(`   链接数: ${resource.files?.length || 0}`);
        console.log('');
      });

      console.log(`📈 总计: ${resources.length} 个资源待发布`);
    } catch (error) {
      console.error('❌ 读取resources.json失败:', error.message);
    }

    console.log('\n🎉 清理完成！');
    console.log('💡 下一步: 推送代码将自动触发新的发布流程');

  } catch (error) {
    console.error('🚨 清理过程出错:', error.message);
  }
}

cleanupAndRestart();