#!/usr/bin/env node

// 检查分类数据的详细脚本
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function checkCategories() {
  console.log('📂 详细检查分类数据...\n');

  try {
    // 获取所有分类
    const categories = await sanityClient.fetch(`
      *[_type == "category"] {
        _id,
        title,
        slug,
        description
      }
    `);

    console.log(`📊 分类总数: ${categories.length}`);

    categories.forEach((category, index) => {
      console.log(`${index + 1}. "${category.title}"`);
      console.log(`   - ID: ${category._id}`);
      console.log(`   - Slug: ${category.slug?.current || '未设置'}`);
      console.log(`   - 描述: ${category.description || '无'}`);
      console.log('');
    });

    // 检查每个分类下的文章数
    console.log('📄 检查每个分类下的文章数:');
    for (const category of categories) {
      const posts = await sanityClient.fetch(`
        *[_type == "post" && references($categoryId)] {
          _id,
          title
        }
      `, { categoryId: category._id });

      console.log(`📁 "${category.title}" (slug: ${category.slug?.current}): ${posts.length}篇文章`);
      posts.forEach(post => {
        console.log(`   - ${post.title}`);
      });
    }

    // 检查文章与分类的关联
    console.log('\n🔗 检查文章与分类的关联:');
    const posts = await sanityClient.fetch(`
      *[_type == "post"] {
        _id,
        title,
        categories[]->{
          _id,
          title,
          slug
        }
      }
    `);

    posts.forEach(post => {
      console.log(`📄 "${post.title}"`);
      if (post.categories && post.categories.length > 0) {
        post.categories.forEach(cat => {
          console.log(`   🏷️ 分类: "${cat.title}" (slug: ${cat.slug?.current})`);
        });
      } else {
        console.log('   ❌ 没有分类');
      }
    });

  } catch (error) {
    console.error('❌ 检查分类数据失败:', error.message);
    throw error;
  }
}

checkCategories().catch((error) => {
  console.error('🚨 检查失败:', error.message);
  process.exit(1);
});