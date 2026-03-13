// 深度调试百度API响应的脚本
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

async function debugBaiduAPI() {
  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;

  console.log('🔍 开始深度调试百度API...\n');

  try {
    // 1. 获取access_token
    console.log('1️⃣ 获取百度access_token...');
    const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, {
      method: 'POST'
    });

    console.log(`   状态码: ${tokenResponse.status}`);

    const tokenData = await tokenResponse.json();
    console.log(`   Token数据:`, JSON.stringify(tokenData, null, 2));

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('无法获取access_token');
    }
    console.log(`   ✅ Token获取成功: ${accessToken.substring(0, 20)}...\n`);

    // 2. 测试简单对话
    console.log('2️⃣ 测试简单对话...');
    const simplePrompt = "请回复：测试成功";

    const simpleResponse = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: simplePrompt
          }
        ]
      })
    });

    console.log(`   状态码: ${simpleResponse.status}`);
    const simpleData = await simpleResponse.json();
    console.log(`   完整响应:`, JSON.stringify(simpleData, null, 2));

    if (simpleData.result) {
      console.log(`   ✅ AI回复: "${simpleData.result}"\n`);
    } else {
      console.log(`   ❌ 没有找到result字段\n`);
      return;
    }

    // 3. 测试结构化内容生成
    console.log('3️⃣ 测试结构化内容生成...');
    const structuredPrompt = `请为科幻电影资源生成一篇文章。

请严格按照以下格式回复，每行一个字段：
标题：[在这里写标题]
摘要：[在这里写摘要]
标签：[标签1,标签2,标签3]
正文：[在这里写正文内容]`;

    const structuredResponse = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: structuredPrompt
          }
        ]
      })
    });

    console.log(`   状态码: ${structuredResponse.status}`);
    const structuredData = await structuredResponse.json();
    console.log(`   完整响应:`, JSON.stringify(structuredData, null, 2));

    if (structuredData.result) {
      console.log(`   ✅ 结构化内容生成成功！`);
      console.log(`   📝 AI生成的内容:\n${structuredData.result}\n`);

      // 4. 测试解析逻辑
      console.log('4️⃣ 测试解析逻辑...');
      const parseStructuredContent = (text) => {
        console.log(`   原始文本长度: ${text.length}`);
        console.log(`   原始文本内容: "${text}"`);

        const lines = text.split('\n').filter(line => line.trim());
        console.log(`   分割后的行数: ${lines.length}`);

        const result = {
          title: "解析失败的标题",
          excerpt: "解析失败的摘要",
          content: text,
          tags: ["解析失败"],
          imagePrompt: "abstract art"
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          console.log(`   处理第${i+1}行: "${line}"`);

          if (line.includes('标题：') || line.includes('标题:')) {
            result.title = line.replace(/.*标题[：:]/, '').trim();
            console.log(`     ✅ 解析到标题: "${result.title}"`);
          } else if (line.includes('摘要：') || line.includes('摘要:')) {
            result.excerpt = line.replace(/.*摘要[：:]/, '').trim();
            console.log(`     ✅ 解析到摘要: "${result.excerpt}"`);
          } else if (line.includes('标签：') || line.includes('标签:')) {
            const tagString = line.replace(/.*标签[：:]/, '').trim();
            result.tags = tagString.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag);
            console.log(`     ✅ 解析到标签: ${JSON.stringify(result.tags)}`);
          } else if (line.includes('正文：') || line.includes('正文:')) {
            result.content = line.replace(/.*正文[：:]/, '').trim();
            console.log(`     ✅ 解析到正文: "${result.content.substring(0, 50)}..."`);
          }
        }

        return result;
      };

      const parsed = parseStructuredContent(structuredData.result);
      console.log(`   📋 解析结果:`, JSON.stringify(parsed, null, 2));

    } else {
      console.log(`   ❌ 结构化内容生成失败`);
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

// 测试优化后的生成函数
async function testOptimizedGeneration() {
  console.log('\n🚀 测试优化后的生成函数...\n');

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

    // 优化的提示词
    const optimizedPrompt = `请为"科幻电影资源分享"生成一篇博客文章。

要求：
1. 内容要规避版权风险，不提及具体影片名称
2. 重点强调资源的特点和使用价值
3. 包含适当的免责声明

请按以下格式输出：
标题：[文章标题，不超过30字]
摘要：[文章摘要，50-80字]
标签：科幻,电影,资源,分享
正文：[正文内容，200-300字，使用markdown格式]

现在开始生成：`;

    const response = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: optimizedPrompt
          }
        ],
        temperature: 0.7,
        top_p: 0.8
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        console.log('✅ 优化后的AI生成成功！');
        console.log('📄 生成内容:');
        console.log('='.repeat(60));
        console.log(data.result);
        console.log('='.repeat(60));

        // 测试解析
        const parseResult = (text) => {
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          const result = {
            title: '',
            excerpt: '',
            tags: [],
            content: text
          };

          for (const line of lines) {
            if (line.startsWith('标题：') || line.startsWith('标题:')) {
              result.title = line.replace(/^标题[：:]/, '').trim();
            } else if (line.startsWith('摘要：') || line.startsWith('摘要:')) {
              result.excerpt = line.replace(/^摘要[：:]/, '').trim();
            } else if (line.startsWith('标签：') || line.startsWith('标签:')) {
              const tagString = line.replace(/^标签[：:]/, '').trim();
              result.tags = tagString.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag);
            } else if (line.startsWith('正文：') || line.startsWith('正文:')) {
              result.content = line.replace(/^正文[：:]/, '').trim();
            }
          }

          // 如果没有解析到具体字段，尝试智能提取
          if (!result.title) {
            const titleMatch = text.match(/(?:标题|题目)[：:]\s*(.+)/);
            if (titleMatch) result.title = titleMatch[1].trim();
          }

          if (!result.excerpt) {
            const excerptMatch = text.match(/(?:摘要|简介|描述)[：:]\s*(.+)/);
            if (excerptMatch) result.excerpt = excerptMatch[1].trim();
          }

          return result;
        };

        const parsed = parseResult(data.result);
        console.log('\n📋 解析后的结构化数据:');
        console.log(`✅ 标题: ${parsed.title || '未解析到标题'}`);
        console.log(`📝 摘要: ${parsed.excerpt || '未解析到摘要'}`);
        console.log(`🏷️ 标签: ${parsed.tags.length > 0 ? parsed.tags.join(', ') : '未解析到标签'}`);
        console.log(`📖 正文: ${parsed.content.substring(0, 100)}...`);

        return parsed;
      }
    }

    throw new Error('优化后的生成也失败了');

  } catch (error) {
    console.error('❌ 优化测试失败:', error.message);
    return null;
  }
}

async function main() {
  await debugBaiduAPI();
  await testOptimizedGeneration();
}

main().catch(console.error);