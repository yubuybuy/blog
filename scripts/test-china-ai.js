// 测试中国AI服务的脚本
import fs from 'fs';

// 手动加载环境变量
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// 测试百度文心一言
async function testBaiduAPI() {
  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;

  if (!apiKey || !secretKey || apiKey === '你的百度文心一言密钥' || secretKey === '你的百度密钥') {
    console.log('❌ 百度API密钥未正确配置');
    return false;
  }

  console.log('🧪 测试百度文心一言API...');

  try {
    // 1. 获取access_token
    console.log('  获取百度access_token...');
    const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, {
      method: 'POST'
    });

    if (!tokenResponse.ok) {
      console.log('❌ 获取百度token失败:', tokenResponse.status);
      return false;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.log('❌ 百度token获取失败:', tokenData);
      return false;
    }

    console.log('  ✅ Token获取成功');

    // 2. 测试文心一言
    console.log('  测试文心一言生成...');
    const response = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "请回复：百度API测试成功"
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 百度文心一言测试成功!');
      console.log('📝 响应:', data.result);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ 百度API测试失败:', response.status);
      console.log('❌ 错误详情:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ 百度API错误:', error.message);
    return false;
  }
}

// 测试智谱GLM
async function testZhipuAPI() {
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey || apiKey === '你的智谱GLM密钥') {
    console.log('❌ 智谱API密钥未正确配置');
    return false;
  }

  console.log('🧪 测试智谱GLM API...');

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "glm-4",
        messages: [
          {
            role: "user",
            content: "请回复：智谱API测试成功"
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 智谱GLM测试成功!');
      console.log('📝 响应:', data.choices[0].message.content);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ 智谱API测试失败:', response.status);
      console.log('❌ 错误详情:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ 智谱API错误:', error.message);
    return false;
  }
}

// 测试文章生成
async function testContentGeneration() {
  console.log('🧪 测试AI文章生成...');

  const testResource = {
    title: "测试资源",
    category: "软件",
    files: ["https://example.com/test"],
    tags: ["测试", "软件", "工具"],
    description: "这是一个测试资源，用于验证AI内容生成功能"
  };

  // 使用百度API生成内容
  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;

  if (apiKey && secretKey && apiKey !== '你的百度文心一言密钥') {
    try {
      // 获取token
      const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, {
        method: 'POST'
      });
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (accessToken) {
        const prompt = `
请为以下资源生成一篇博客文章，要求规避版权风险：

资源信息：
- 分类：${testResource.category}
- 标签：${testResource.tags.join(', ')}
- 描述：${testResource.description}

请按JSON格式返回：
{
  "title": "文章标题",
  "excerpt": "文章摘要(50字左右)",
  "content": "文章正文(markdown格式，200字左右)",
  "tags": ["标签1", "标签2"],
  "imagePrompt": "配图描述"
}
`;

        const response = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ AI文章生成成功!');
          console.log('📄 生成的内容:');
          console.log(data.result);
          return true;
        }
      }
    } catch (error) {
      console.log('❌ 文章生成失败:', error.message);
    }
  }

  return false;
}

async function main() {
  console.log('🚀 开始测试中国AI服务...\n');

  console.log('📋 配置检查:');
  console.log('- 百度API Key:', process.env.BAIDU_API_KEY ?
    (process.env.BAIDU_API_KEY === '你的百度文心一言密钥' ? '❌ 请配置真实密钥' : '✅ 已配置') : '❌ 未配置');
  console.log('- 百度Secret Key:', process.env.BAIDU_SECRET_KEY ?
    (process.env.BAIDU_SECRET_KEY === '你的百度密钥' ? '❌ 请配置真实密钥' : '✅ 已配置') : '❌ 未配置');
  console.log('- 智谱API Key:', process.env.ZHIPU_API_KEY ?
    (process.env.ZHIPU_API_KEY === '你的智谱GLM密钥' ? '❌ 请配置真实密钥' : '✅ 已配置') : '❌ 未配置');
  console.log('');

  const baiduResult = await testBaiduAPI();
  console.log('');
  const zhipuResult = await testZhipuAPI();
  console.log('');

  if (baiduResult || zhipuResult) {
    await testContentGeneration();
  }

  console.log('\n📊 测试结果总结:');
  console.log(`- 百度文心一言: ${baiduResult ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`- 智谱GLM: ${zhipuResult ? '✅ 可用' : '❌ 不可用'}`);

  if (baiduResult || zhipuResult) {
    console.log('\n🎉 恭喜！至少有一个AI服务可用，可以开始自动写文章了！');
    console.log('\n📝 下一步操作:');
    console.log('1. 确保 resources.json 中有要处理的资源');
    console.log('2. 运行: npm run auto-publish (或先测试: npm run test-publisher)');
  } else {
    console.log('\n⚠️  所有AI服务都不可用，将使用模板模式生成文章');
  }
}

main().catch(console.error);