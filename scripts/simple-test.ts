#!/usr/bin/env node

// 简化的AI测试脚本
async function testAI() {
  console.log('🚀 测试AI内容生成功能...\n');

  try {
    // 导入AI服务
    const { AIContentGenerator } = await import('../src/lib/ai-services');

    // 创建生成器
    const generator = new AIContentGenerator({
      geminiKey: process.env.GEMINI_API_KEY,
      cohereKey: process.env.COHERE_API_KEY
    });

    // 测试资源
    const testResource = {
      title: "测试电影资源",
      category: "电影",
      type: "影视资源",
      files: ["https://pan.baidu.com/s/test123"],
      tags: ["2024", "测试", "高清"],
      description: "这是一个测试用的电影资源描述"
    };

    console.log('📝 生成内容中...');
    const content = await generator.generateContent(testResource);

    console.log('✅ 内容生成成功!');
    console.log('📄 生成的标题:', content.title);
    console.log('📝 生成的摘要:', content.excerpt);
    console.log('🏷️  生成的标签:', content.tags.join(', '));
    console.log('🖼️  图片提示词:', content.imagePrompt);

    console.log('\n🎉 AI系统工作正常！');

  } catch (error) {
    console.error('❌ 测试失败:', error instanceof Error ? error.message : error);

    console.log('\n📋 可能的解决方案:');
    console.log('1. 检查API密钥是否正确设置');
    console.log('2. 确保网络连接正常');
    console.log('3. 验证免费额度是否用完');
  }
}

if (require.main === module) {
  testAI();
}