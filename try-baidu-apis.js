// 尝试不同的百度API接口
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

async function tryDifferentBaiduAPIs() {
  console.log('🔧 尝试不同的百度API接口...\n');

  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;

  try {
    // 获取token
    const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, {
      method: 'POST'
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('无法获取access_token');
    }

    console.log('✅ Token获取成功\n');

    // 尝试不同的API接口
    const apiEndpoints = [
      {
        name: '文心一言 (ERNIE-Bot)',
        url: `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_bot_8k?access_token=${accessToken}`,
      },
      {
        name: '文心一言 (ERNIE-Bot-turbo)',
        url: `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant?access_token=${accessToken}`,
      },
      {
        name: '文心一言 (ERNIE-Bot 4.0)',
        url: `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`,
      },
      {
        name: '文心一言 (基础版)',
        url: `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_bot?access_token=${accessToken}`,
      }
    ];

    for (const endpoint of apiEndpoints) {
      console.log(`🧪 测试 ${endpoint.name}...`);

      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: "请回复：API测试成功"
              }
            ]
          })
        });

        console.log(`   状态码: ${response.status}`);

        const data = await response.json();
        console.log(`   响应: ${JSON.stringify(data, null, 2)}`);

        if (data.result) {
          console.log(`   ✅ ${endpoint.name} 可用！`);
          console.log(`   📝 AI回复: "${data.result}"\n`);

          // 如果找到可用的接口，测试文章生成
          console.log(`🚀 使用 ${endpoint.name} 生成文章测试...\n`);

          const articleResponse = await fetch(endpoint.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: `请为"科幻电影资源"写一篇简短的博客文章。

要求：
- 标题不超过20字
- 内容200字左右
- 避免版权问题
- 包含免责声明

请按此格式回复：
标题：[标题内容]
摘要：[摘要内容]
内容：[正文内容]`
                }
              ]
            })
          });

          if (articleResponse.ok) {
            const articleData = await articleResponse.json();
            if (articleData.result) {
              console.log('✅ 文章生成成功！');
              console.log('📄 生成内容:');
              console.log('='.repeat(50));
              console.log(articleData.result);
              console.log('='.repeat(50));
              return { endpoint: endpoint.name, url: endpoint.url, content: articleData.result };
            }
          }

        } else if (data.error_code) {
          console.log(`   ❌ ${endpoint.name} 错误: ${data.error_msg} (代码: ${data.error_code})`);
        } else {
          console.log(`   ❌ ${endpoint.name} 响应格式异常`);
        }

      } catch (error) {
        console.log(`   ❌ ${endpoint.name} 请求失败: ${error.message}`);
      }

      console.log('');
    }

    console.log('⚠️  所有接口都不可用');
    return null;

  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
    return null;
  }
}

// 检查权限状态并提供解决建议
function provideSolutions() {
  console.log('\n💡 权限问题解决方案:\n');

  console.log('🔍 1. 检查百度云控制台');
  console.log('   - 访问: https://console.bce.baidu.com/qianfan/');
  console.log('   - 确认应用状态是否正常');
  console.log('   - 检查是否需要申请文心一言使用权限');
  console.log('   - 确认账户是否完成实名认证\n');

  console.log('💳 2. 检查计费状态');
  console.log('   - 文心一言可能需要充值才能使用');
  console.log('   - 检查是否有免费额度可以申请');
  console.log('   - 确认API调用是否需要付费\n');

  console.log('🔑 3. 重新创建应用');
  console.log('   - 在千帆控制台创建新的应用');
  console.log('   - 确保选择正确的服务类型');
  console.log('   - 获取新的API Key和Secret Key\n');

  console.log('📋 4. 备选方案');
  console.log('   - 暂时使用模板生成模式');
  console.log('   - 尝试其他国内AI服务商');
  console.log('   - 等待权限问题解决后再使用AI\n');

  console.log('🎯 立即建议: 使用模板模式，质量已经很高！');
}

async function main() {
  const result = await tryDifferentBaiduAPIs();

  if (!result) {
    provideSolutions();
  }
}

main().catch(console.error);