// 支持代理的AI API测试工具
import fs from 'fs';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

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

// 代理配置检测
function detectProxySettings() {
  console.log('🔍 检测代理设置...\n');

  const commonProxyPorts = [7890, 1080, 8080, 10809, 10808];
  const proxySettings = [];

  // 检查环境变量中的代理设置
  if (process.env.HTTP_PROXY) {
    proxySettings.push({
      type: '环境变量HTTP代理',
      url: process.env.HTTP_PROXY,
      source: 'HTTP_PROXY'
    });
  }

  if (process.env.HTTPS_PROXY) {
    proxySettings.push({
      type: '环境变量HTTPS代理',
      url: process.env.HTTPS_PROXY,
      source: 'HTTPS_PROXY'
    });
  }

  // 检测常见代理端口
  for (const port of commonProxyPorts) {
    proxySettings.push({
      type: '常见代理端口',
      url: `http://127.0.0.1:${port}`,
      source: `本地端口${port}`
    });
  }

  console.log('📋 可用的代理配置:');
  proxySettings.forEach((setting, index) => {
    console.log(`${index + 1}. ${setting.type}: ${setting.url}`);
  });

  return proxySettings;
}

// 测试代理连接
async function testProxyConnection(proxyUrl) {
  console.log(`🧪 测试代理: ${proxyUrl}`);

  try {
    const agent = new HttpsProxyAgent(proxyUrl);

    // 使用代理测试Google连接
    const testUrl = 'https://www.google.com';

    const response = await fetch(testUrl, {
      method: 'HEAD',
      agent: agent,
      timeout: 10000
    });

    if (response.ok) {
      console.log(`   ✅ 代理可用 (${response.status})`);
      return true;
    } else {
      console.log(`   ❌ 代理响应异常 (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 代理连接失败: ${error.message}`);
    return false;
  }
}

// 使用代理测试Gemini API
async function testGeminiWithProxy(proxyUrl) {
  console.log(`🤖 使用代理测试Gemini API...`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('❌ 未找到Gemini API密钥');
    return false;
  }

  try {
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: '请回复：Gemini API测试成功'
          }]
        }]
      }),
      agent: agent
    });

    if (response.ok) {
      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        console.log(`   ✅ Gemini API可用！`);
        console.log(`   📝 AI回复: ${data.candidates[0].content.parts[0].text}`);
        return true;
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Gemini API失败 (${response.status}): ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Gemini请求错误: ${error.message}`);
  }

  return false;
}

// 使用代理测试Cohere API
async function testCohereWithProxy(proxyUrl) {
  console.log(`🧠 使用代理测试Cohere API...`);

  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    console.log('❌ 未找到Cohere API密钥');
    return false;
  }

  try {
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: '请回复：Cohere API测试成功',
        max_tokens: 50
      }),
      agent: agent
    });

    if (response.ok) {
      const data = await response.json();
      if (data.generations && data.generations[0]) {
        console.log(`   ✅ Cohere API可用！`);
        console.log(`   📝 AI回复: ${data.generations[0].text.trim()}`);
        return true;
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Cohere API失败 (${response.status}): ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Cohere请求错误: ${error.message}`);
  }

  return false;
}

// 自动检测和配置最佳代理
async function autoConfigureProxy() {
  console.log('🚀 自动检测和配置代理...\n');

  const proxySettings = detectProxySettings();
  console.log('');

  let workingProxy = null;

  // 测试每个代理设置
  for (const proxySetting of proxySettings) {
    console.log(`🔧 测试代理配置: ${proxySetting.source}`);

    const isWorking = await testProxyConnection(proxySetting.url);

    if (isWorking) {
      console.log('   🎯 代理连接成功，测试AI API...\n');

      const geminiWorks = await testGeminiWithProxy(proxySetting.url);
      const cohereWorks = await testCohereWithProxy(proxySetting.url);

      if (geminiWorks || cohereWorks) {
        workingProxy = proxySetting;
        console.log(`\n✅ 找到可用代理: ${proxySetting.url}`);
        console.log(`   - Gemini: ${geminiWorks ? '✅ 可用' : '❌ 不可用'}`);
        console.log(`   - Cohere: ${cohereWorks ? '✅ 可用' : '❌ 不可用'}`);
        break;
      }
    }

    console.log('');
  }

  if (workingProxy) {
    console.log('\n🎉 代理配置成功！');
    console.log('\n📝 推荐的环境变量配置:');
    console.log(`HTTP_PROXY=${workingProxy.url}`);
    console.log(`HTTPS_PROXY=${workingProxy.url}`);

    return workingProxy;
  } else {
    console.log('\n❌ 未找到可用的代理配置');
    console.log('\n💡 解决建议:');
    console.log('1. 确保代理软件正在运行');
    console.log('2. 检查代理端口是否正确');
    console.log('3. 尝试不同的代理服务器');
    console.log('4. 确认代理支持HTTPS连接');

    return null;
  }
}

// 提供代理配置指南
function showProxyGuide() {
  console.log('\n📖 代理配置指南:\n');

  console.log('🔧 常见代理软件及默认端口:');
  console.log('- Clash: http://127.0.0.1:7890');
  console.log('- V2rayN: http://127.0.0.1:10809');
  console.log('- Shadowsocks: http://127.0.0.1:1080');
  console.log('- Proxifier: http://127.0.0.1:8080');

  console.log('\n⚙️ 配置步骤:');
  console.log('1. 确保你的代理软件正在运行');
  console.log('2. 记下HTTP代理端口（通常在软件设置中）');
  console.log('3. 在 .env.local 中添加:');
  console.log('   HTTP_PROXY=http://127.0.0.1:你的端口号');
  console.log('   HTTPS_PROXY=http://127.0.0.1:你的端口号');

  console.log('\n🧪 测试方法:');
  console.log('- 在代理软件中开启"系统代理"');
  console.log('- 在浏览器中访问 google.com 确认代理工作');
  console.log('- 运行本脚本测试API连接');

  console.log('\n⚠️ 注意事项:');
  console.log('- 确保代理服务器支持HTTPS');
  console.log('- 有些代理需要用户名密码认证');
  console.log('- 如果API调用失败，尝试重启代理软件');
}

async function main() {
  console.log('🌐 国外AI API代理配置工具\n');
  console.log('='.repeat(60));

  // 显示当前API密钥状态
  console.log('📋 当前API密钥状态:');
  console.log(`- Gemini: ${process.env.GEMINI_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`- Cohere: ${process.env.COHERE_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
  console.log('');

  const workingProxy = await autoConfigureProxy();

  if (!workingProxy) {
    showProxyGuide();
  }
}

main().catch(console.error);