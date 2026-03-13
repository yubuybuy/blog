// 简单的AI API测试脚本
import dotenv from 'dotenv';
import fs from 'fs';

// 手动加载环境变量
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('❌ Gemini API Key 未设置');
    return false;
  }

  console.log('🧪 测试 Gemini API...');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: '请回复："API测试成功"'
          }]
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini API 测试成功!');
      console.log('📝 响应:', data.candidates[0].content.parts[0].text);
      return true;
    } else {
      console.log('❌ Gemini API 测试失败:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API 错误:', error.message);
    return false;
  }
}

async function testCohereAPI() {
  const apiKey = process.env.COHERE_API_KEY;

  if (!apiKey) {
    console.log('❌ Cohere API Key 未设置');
    return false;
  }

  console.log('🧪 测试 Cohere API...');

  try {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: '请回复：API测试成功',
        max_tokens: 20
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cohere API 测试成功!');
      console.log('📝 响应:', data.generations[0].text.trim());
      return true;
    } else {
      console.log('❌ Cohere API 测试失败:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Cohere API 错误:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始API验证...\n');

  console.log('📋 环境变量检查:');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ 已设置' : '❌ 未设置');
  console.log('- COHERE_API_KEY:', process.env.COHERE_API_KEY ? '✅ 已设置' : '❌ 未设置');
  console.log('- SANITY_API_TOKEN:', process.env.SANITY_API_TOKEN ? '✅ 已设置' : '❌ 未设置');
  console.log('- AUTO_PUBLISH:', process.env.AUTO_PUBLISH || '未设置');
  console.log('');

  const geminiResult = await testGeminiAPI();
  console.log('');
  const cohereResult = await testCohereAPI();

  console.log('\n📊 测试结果:');
  console.log(`- Gemini: ${geminiResult ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`- Cohere: ${cohereResult ? '✅ 可用' : '❌ 不可用'}`);

  if (geminiResult || cohereResult) {
    console.log('\n🎉 AI功能配置成功！可以开始自动写文章了！');
  } else {
    console.log('\n⚠️  请检查API密钥是否正确配置');
  }
}

main().catch(console.error);