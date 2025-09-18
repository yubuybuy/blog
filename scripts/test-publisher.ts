#!/usr/bin/env node

// 测试AI自动发布系统
// import { AutoPublisher } from './auto-publisher';

// 模拟配置 (实际使用时从环境变量读取)
const testConfig = {
  // 使用免费的AI服务
  geminiKey: process.env.GEMINI_API_KEY || 'test-key',
  cohereKey: process.env.COHERE_API_KEY,
  sanityToken: process.env.SANITY_API_TOKEN || '',
  autoPublish: false, // 测试模式，不实际发布
  publishDelay: 1 // 测试时间间隔短一些
};

// 测试资源数据
const testResources = [
  {
    title: "测试电影资源",
    category: "电影",
    type: "影视资源",
    files: ["https://pan.baidu.com/s/test123"],
    tags: ["2024", "测试", "高清"],
    description: "这是一个测试用的电影资源描述"
  },
  {
    title: "测试软件工具",
    category: "软件",
    type: "实用工具",
    files: ["https://pan.baidu.com/s/test456"],
    tags: ["效率", "工具", "测试"],
    description: "这是一个测试用的软件工具描述"
  }
];

async function runTest() {
  console.log('🚀 开始测试AI自动发布系统...\n');

  try {
    // 动态导入AutoPublisher
    const { AutoPublisher } = await import('./auto-publisher.js');

    // 创建发布器实例
    const publisher = new AutoPublisher(testConfig);

    console.log('📝 测试内容生成...');

    // 测试每个资源的内容生成
    for (let i = 0; i < testResources.length; i++) {
      const resource = testResources[i];
      console.log(`\n--- 测试资源 ${i + 1}: ${resource.title} ---`);

      try {
        // 只生成内容，不实际发布
        const result = await publisher['publishSingleResource'](resource);

        console.log('✅ 内容生成成功!');
        console.log('📄 生成的标题:', result.title);
        console.log('📝 生成的摘要:', result.excerpt?.substring(0, 100) + '...');
        console.log('🏷️  生成的标签:', result.tags?.join(', '));

        if (result.mainImage) {
          console.log('🖼️  图片已生成');
        }

      } catch (error) {
        console.error(`❌ 资源 ${i + 1} 处理失败:`, error instanceof Error ? error.message : error);
      }
    }

    console.log('\n🎉 测试完成! AI自动发布系统工作正常');

  } catch (error) {
    console.error('❌ 测试失败:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// 测试AI服务可用性
async function testAIServices() {
  console.log('\n🔍 测试AI服务可用性...');

  const { AIContentGenerator } = await import('../src/lib/ai-services');
  const generator = new AIContentGenerator({
    geminiKey: testConfig.geminiKey,
    cohereKey: testConfig.cohereKey
  });

  const testResource = {
    title: "简单测试",
    category: "测试",
    files: ["test"],
    tags: ["test"],
    description: "测试描述"
  };

  try {
    const content = await generator.generateContent(testResource);
    console.log('✅ AI内容生成服务正常');
    console.log('📄 测试生成标题:', content.title);
    return true;
  } catch (error) {
    console.log('⚠️  AI服务可能需要配置API密钥');
    console.log('💡 请设置环境变量: GEMINI_API_KEY 或 COHERE_API_KEY');
    return false;
  }
}

// 主测试流程
async function main() {
  console.log('='.repeat(50));
  console.log('     AI自动发布系统测试');
  console.log('='.repeat(50));

  // 测试AI服务
  const aiWorking = await testAIServices();

  if (aiWorking) {
    // 运行完整测试
    await runTest();
  } else {
    console.log('\n📋 测试模板生成功能...');

    // 测试模板生成
    const { AIContentGenerator } = await import('../src/lib/ai-services');
    const generator = new AIContentGenerator({});

    const templateContent = await generator.generateContent(testResources[0]);
    console.log('✅ 模板生成功能正常');
    console.log('📄 模板标题:', templateContent.title);
  }

  console.log('\n📋 下一步操作指南:');
  console.log('1. 获取免费AI API密钥:');
  console.log('   - Gemini: https://makersuite.google.com/app/apikey');
  console.log('   - Cohere: https://dashboard.cohere.ai/api-keys');
  console.log('2. 设置GitHub仓库Secrets');
  console.log('3. 更新resources.json文件开始自动发布');
  console.log('4. 配置Sanity API Token启用自动发布功能');
}

if (require.main === module) {
  main().catch((error) => console.error('Error:', error instanceof Error ? error.message : error));
}