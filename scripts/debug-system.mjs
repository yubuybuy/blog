#!/usr/bin/env node

// 简化的JavaScript调试脚本
import { createClient } from '@sanity/client';

// Sanity客户端配置
const sanityClient = createClient({
  projectId: 'w7iihdoh',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

async function testSystem() {
  console.log('🔍 开始系统诊断...\n');

  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ 已设置' : '❌ 未设置');
  console.log('- COHERE_API_KEY:', process.env.COHERE_API_KEY ? '✅ 已设置' : '❌ 未设置');
  console.log('- SANITY_API_TOKEN:', process.env.SANITY_API_TOKEN ? '✅ 已设置' : '❌ 未设置');
  console.log('- AUTO_PUBLISH:', process.env.AUTO_PUBLISH || '未设置');

  // 2. 测试Sanity连接
  console.log('\n🗄️ 测试Sanity连接...');
  try {
    const existingPosts = await sanityClient.fetch('*[_type == "post"] | order(_createdAt desc) [0...3]');
    console.log('✅ Sanity连接成功!');
    console.log(`📊 现有文章数量: ${existingPosts.length}`);
    if (existingPosts.length > 0) {
      console.log(`📝 最新文章: "${existingPosts[0].title}"`);
    }
  } catch (error) {
    console.error('❌ Sanity连接失败:', error.message);
    return;
  }

  // 3. 创建测试文章
  console.log('\n📝 创建测试文章...');
  try {
    const testPost = {
      _type: 'post',
      title: `AI测试文章 - ${new Date().toLocaleString()}`,
      slug: {
        _type: 'slug',
        current: `ai-test-${Date.now()}`
      },
      excerpt: '这是一个AI自动生成的测试文章，用于验证发布系统是否正常工作。',
      publishedAt: new Date().toISOString(),
      body: [
        {
          _type: 'block',
          style: 'h1',
          children: [{ _type: 'span', text: 'AI自动化测试' }]
        },
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '这是一个测试文章，验证AI自动发布系统是否正常工作。' }]
        },
        {
          _type: 'block',
          style: 'h2',
          children: [{ _type: 'span', text: '系统状态' }]
        },
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '✅ GitHub Actions运行正常' }]
        },
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '✅ Sanity连接成功' }]
        },
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '✅ 内容发布成功' }]
        },
        {
          _type: 'block',
          style: 'h2',
          children: [{ _type: 'span', text: '免责声明' }]
        },
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '本文章由AI自动生成，仅供测试使用。如有问题请联系管理员删除。' }]
        }
      ],
      tags: ['AI', '测试', '自动化', '发布']
    };

    // 发布文章
    const result = await sanityClient.create(testPost);
    console.log('✅ 测试文章创建成功!');
    console.log(`📄 文章ID: ${result._id}`);
    console.log(`🔗 预览链接: https://blog-delta-five-13.vercel.app/posts/${testPost.slug.current}`);

  } catch (error) {
    console.error('❌ 文章创建失败:', error.message);
    return;
  }

  console.log('\n🎉 系统诊断完成!');
  console.log('\n📋 总结:');
  console.log('1. ✅ Sanity连接和发布功能正常');
  console.log('2. ✅ 测试文章已成功创建');
  console.log('3. 🔄 请检查网站是否显示新文章');
  console.log('4. ⏰ 如果没有显示，可能需要等待Vercel缓存更新(1-2分钟)');
}

testSystem().catch((error) => {
  console.error('🚨 系统诊断失败:', error.message);
  process.exit(1);
});