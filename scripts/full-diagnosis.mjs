#!/usr/bin/env node

// 详细诊断发布问题
import { createClient } from '@sanity/client';
import fs from 'fs';

const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function fullDiagnosis() {
  console.log('🔍 开始详细诊断...\n');

  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('- SANITY_API_TOKEN:', process.env.SANITY_API_TOKEN ? '✅ 已设置' : '❌ 未设置');
  console.log('- Token长度:', process.env.SANITY_API_TOKEN?.length || 0);

  // 2. 检查Sanity连接和权限
  console.log('\n🔗 测试Sanity连接和权限...');
  try {
    // 测试读取权限
    const posts = await sanityClient.fetch('*[_type == "post"]');
    console.log(`✅ 读取权限正常，当前文章数: ${posts.length}`);

    // 测试写入权限
    const testDoc = {
      _type: 'post',
      title: `诊断测试文章 ${new Date().toISOString()}`,
      slug: {
        _type: 'slug',
        current: `test-${Date.now()}`
      },
      excerpt: '这是一个诊断测试文章',
      publishedAt: new Date().toISOString(),
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '诊断测试内容' }]
        }
      ],
      tags: ['测试']
    };

    const result = await sanityClient.create(testDoc);
    console.log(`✅ 写入权限正常，测试文章ID: ${result._id}`);

    // 立即删除测试文章
    await sanityClient.delete(result._id);
    console.log('🗑️ 测试文章已删除');

  } catch (error) {
    console.error('❌ Sanity权限测试失败:', error.message);
    return;
  }

  // 3. 检查resources.json
  console.log('\n📄 检查resources.json...');
  try {
    const content = fs.readFileSync('./resources.json', 'utf-8');
    const resources = JSON.parse(content);
    console.log(`📊 资源数量: ${resources.length}`);

    resources.forEach((resource, index) => {
      console.log(`${index + 1}. "${resource.title}" (${resource.category})`);
      console.log(`   文件: ${resource.files?.length || 0}个`);
      console.log(`   标签: ${resource.tags?.join(', ') || '无'}`);
    });

  } catch (error) {
    console.error('❌ 读取resources.json失败:', error.message);
    return;
  }

  // 4. 检查已发布记录
  console.log('\n📝 检查已发布记录...');
  try {
    if (fs.existsSync('./processed/published-titles.txt')) {
      const publishedContent = fs.readFileSync('./processed/published-titles.txt', 'utf-8');
      const publishedTitles = publishedContent.split('\n').filter(line => line.trim());
      console.log(`📋 已发布标题数: ${publishedTitles.length}`);
      publishedTitles.forEach((title, index) => {
        console.log(`${index + 1}. ${title}`);
      });
    } else {
      console.log('📝 没有已发布记录文件');
    }
  } catch (error) {
    console.error('❌ 读取已发布记录失败:', error.message);
  }

  // 5. 模拟发布流程
  console.log('\n🔄 模拟发布流程...');
  try {
    const content = fs.readFileSync('./resources.json', 'utf-8');
    const resources = JSON.parse(content);

    // 检查已发布记录
    let publishedTitles = [];
    try {
      if (fs.existsSync('./processed/published-titles.txt')) {
        const publishedContent = fs.readFileSync('./processed/published-titles.txt', 'utf-8');
        publishedTitles = publishedContent.split('\n').filter(line => line.trim());
      }
    } catch (error) {
      console.log('📝 没有已发布记录，将处理所有资源');
    }

    // 过滤新资源
    const newResources = resources.filter(resource =>
      !publishedTitles.includes(resource.title)
    );

    console.log(`📈 总资源: ${resources.length}, 新资源: ${newResources.length}`);

    if (newResources.length === 0) {
      console.log('⚠️ 没有新资源需要发布！');
      console.log('💡 可能原因:');
      console.log('- 所有资源都已经发布过了');
      console.log('- 标题匹配已发布记录');

      // 显示对比
      console.log('\n🔍 标题对比:');
      resources.forEach(resource => {
        const isPublished = publishedTitles.includes(resource.title);
        console.log(`${isPublished ? '❌' : '✅'} "${resource.title}"`);
      });
    } else {
      console.log('✅ 找到新资源，应该可以发布');
      newResources.forEach((resource, index) => {
        console.log(`${index + 1}. "${resource.title}" - 准备发布`);
      });
    }

  } catch (error) {
    console.error('❌ 模拟发布流程失败:', error.message);
  }

  // 6. 验证网站数据获取
  console.log('\n🌐 验证网站数据获取...');
  try {
    const websitePosts = await sanityClient.fetch(`
      *[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        publishedAt,
        _createdAt
      }
    `);

    console.log(`📱 网站可获取文章数: ${websitePosts.length}`);
    if (websitePosts.length > 0) {
      console.log('📄 最近的文章:');
      websitePosts.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. "${post.title}"`);
        console.log(`   创建时间: ${post._createdAt}`);
        console.log(`   发布时间: ${post.publishedAt}`);
      });
    }

  } catch (error) {
    console.error('❌ 网站数据获取测试失败:', error.message);
  }

  console.log('\n📋 诊断完成！');
}

fullDiagnosis().catch((error) => {
  console.error('🚨 诊断失败:', error.message);
  process.exit(1);
});