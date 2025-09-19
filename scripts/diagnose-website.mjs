#!/usr/bin/env node

// 检查网站数据问题
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false, // 确保获取最新数据
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function diagnoseWebsite() {
  console.log('🔍 诊断网站数据获取问题...\n');

  try {
    // 1. 检查所有文章（包括没有作者的）
    console.log('📊 检查所有文章数据:');
    const allPosts = await sanityClient.fetch(`
      *[_type == "post"] | order(_createdAt desc) [0...5] {
        _id,
        title,
        slug,
        publishedAt,
        _createdAt,
        author,
        categories
      }
    `);

    console.log(`✅ 总文章数: ${allPosts.length}`);
    allPosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`);
      console.log(`   - ID: ${post._id}`);
      console.log(`   - Slug: ${post.slug?.current || '无slug'}`);
      console.log(`   - 发布时间: ${post.publishedAt || '未设置'}`);
      console.log(`   - 创建时间: ${post._createdAt}`);
      console.log(`   - 作者: ${post.author ? '有' : '无'}`);
      console.log(`   - 分类: ${post.categories?.length || 0}个`);
      console.log('');
    });

    // 2. 测试网站的查询逻辑（模拟网站查询）
    console.log('🌐 测试网站查询逻辑:');
    const websiteQuery = `
      *[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        mainImage,
        author->{
          name,
          image
        },
        categories[]->{
          title,
          slug
        }
      }
    `;

    const websitePosts = await sanityClient.fetch(websiteQuery);
    console.log(`📱 网站查询结果: ${websitePosts.length}篇文章`);

    if (websitePosts.length === 0) {
      console.log('❌ 网站查询没有返回文章！');
      console.log('🔍 可能原因:');
      console.log('1. 文章没有设置publishedAt字段');
      console.log('2. 文章缺少必需的author引用');
      console.log('3. Sanity查询权限问题');
    } else {
      console.log('✅ 网站查询正常');
      websitePosts.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. "${post.title}" - ${post.publishedAt}`);
      });
    }

    // 3. 检查作者数据
    console.log('\n👤 检查作者数据:');
    const authors = await sanityClient.fetch('*[_type == "author"]');
    console.log(`作者数量: ${authors.length}`);

    // 4. 检查分类数据
    console.log('\n📂 检查分类数据:');
    const categories = await sanityClient.fetch('*[_type == "category"]');
    console.log(`分类数量: ${categories.length}`);

    // 5. 修复建议
    console.log('\n🛠️ 修复建议:');
    if (allPosts.length > 0 && websitePosts.length === 0) {
      console.log('需要为文章添加缺失的数据：');

      if (authors.length === 0) {
        console.log('- 创建至少一个作者');
      }

      const postsWithoutPublishDate = allPosts.filter(p => !p.publishedAt);
      if (postsWithoutPublishDate.length > 0) {
        console.log(`- ${postsWithoutPublishDate.length}篇文章缺少发布时间`);
      }
    }

  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  }
}

diagnoseWebsite();