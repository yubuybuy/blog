#!/usr/bin/env node

// 修复现有分类的slug
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function fixCategorySlugs() {
  console.log('🔧 修复分类slug...\n');

  try {
    // 分类映射
    const categoryMap = {
      '电影': 'movies',
      '软件': 'software',
      '教育': 'education',
      '游戏': 'games',
      '音乐': 'music',
      '图书': 'books',
      '其他': 'others'
    };

    // 获取所有分类
    const categories = await sanityClient.fetch(`
      *[_type == "category"] {
        _id,
        title,
        slug
      }
    `);

    console.log(`📊 找到 ${categories.length} 个分类`);

    for (const category of categories) {
      const newSlug = categoryMap[category.title] || category.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      if (category.slug?.current !== newSlug) {
        console.log(`🔄 更新分类 "${category.title}": ${category.slug?.current} -> ${newSlug}`);

        await sanityClient
          .patch(category._id)
          .set({
            slug: {
              _type: 'slug',
              current: newSlug
            }
          })
          .commit();

        console.log(`✅ "${category.title}" slug已更新`);
      } else {
        console.log(`✅ "${category.title}" slug已是正确的: ${newSlug}`);
      }
    }

    console.log('\n🎉 所有分类slug修复完成！');

  } catch (error) {
    console.error('❌ 修复分类slug失败:', error.message);
    throw error;
  }
}

fixCategorySlugs().catch((error) => {
  console.error('🚨 修复失败:', error.message);
  process.exit(1);
});