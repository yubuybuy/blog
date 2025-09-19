#!/usr/bin/env node

// 修复所有分类slug问题
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function fixAllCategorySlugs() {
  console.log('🔧 修复所有分类slug问题...\n');

  try {
    const categories = await sanityClient.fetch('*[_type == "category"]');

    const categorySlugMap = {
      '电影': 'movies',
      '软件': 'software',
      '教育': 'education',
      '测试分类': 'test-category',
      '游戏': 'games',
      '音乐': 'music',
      '图书': 'books',
      '其他': 'others'
    };

    for (const category of categories) {
      if (!category.title) {
        console.log(`⚠️ 跳过无标题分类: ${category._id}`);
        continue;
      }

      let newSlug;
      if (categorySlugMap[category.title]) {
        newSlug = categorySlugMap[category.title];
      } else {
        // 生成通用slug
        newSlug = category.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }

      console.log(`🔄 处理分类 "${category.title}"`);
      console.log(`   当前slug: ${category.slug?.current || '未设置'}`);
      console.log(`   目标slug: ${newSlug}`);

      if (!category.slug?.current || category.slug.current !== newSlug) {
        await sanityClient
          .patch(category._id)
          .set({
            slug: {
              _type: 'slug',
              current: newSlug
            }
          })
          .commit();
        console.log(`   ✅ 已更新为: ${newSlug}`);
      } else {
        console.log(`   ✅ 已是正确的slug`);
      }
      console.log('');
    }

    console.log('🎉 所有分类slug修复完成！');

    // 验证结果
    console.log('\n📋 验证修复结果:');
    const updatedCategories = await sanityClient.fetch('*[_type == "category"]');
    updatedCategories.forEach(cat => {
      console.log(`✅ "${cat.title}" -> /categories/${cat.slug?.current}`);
    });

  } catch (error) {
    console.error('❌ 修复分类slug失败:', error.message);
    throw error;
  }
}

fixAllCategorySlugs().catch((error) => {
  console.error('🚨 修复失败:', error.message);
  process.exit(1);
});