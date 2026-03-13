// 完整的AI vs 模板生成对比演示
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

// 百度AI文章生成
async function generateWithBaiduAI(resourceInfo) {
  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;

  try {
    // 1. 获取access_token
    const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, {
      method: 'POST'
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('无法获取百度access_token');
    }

    // 2. 生成文章内容
    const prompt = `
请为以下网盘资源生成一篇博客文章，要求规避版权风险：

资源信息：
- 标题：${resourceInfo.title}
- 分类：${resourceInfo.category}
- 标签：${resourceInfo.tags.join(', ')}
- 描述：${resourceInfo.description}

要求：
1. 标题要通用化，避免具体作品名称
2. 重点强调资源特性和使用价值
3. 内容要有实用性，包含使用建议
4. 添加适当的免责声明
5. 格式要求：标题50字内，摘要100字内，正文300-500字

请按以下格式返回：
标题：[文章标题]
摘要：[文章摘要]
正文：[markdown格式的正文内容]
标签：[标签1,标签2,标签3]
配图描述：[配图提示词]
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

    if (!response.ok) {
      throw new Error(`百度API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.result;

    // 解析百度AI的回复
    const parseAIResponse = (text) => {
      const lines = text.split('\n').filter(line => line.trim());
      const result = {
        title: "AI生成文章",
        excerpt: "AI生成的文章摘要",
        content: text,
        tags: resourceInfo.tags,
        imagePrompt: "abstract digital art"
      };

      // 尝试解析结构化内容
      for (const line of lines) {
        if (line.startsWith('标题：') || line.startsWith('标题:')) {
          result.title = line.replace(/^标题[：:]/, '').trim();
        } else if (line.startsWith('摘要：') || line.startsWith('摘要:')) {
          result.excerpt = line.replace(/^摘要[：:]/, '').trim();
        } else if (line.startsWith('正文：') || line.startsWith('正文:')) {
          result.content = line.replace(/^正文[：:]/, '').trim();
        } else if (line.startsWith('标签：') || line.startsWith('标签:')) {
          result.tags = line.replace(/^标签[：:]/, '').split(',').map(tag => tag.trim());
        } else if (line.startsWith('配图描述：') || line.startsWith('配图描述:')) {
          result.imagePrompt = line.replace(/^配图描述[：:]/, '').trim();
        }
      }

      return result;
    };

    return parseAIResponse(content);

  } catch (error) {
    console.error('百度AI生成失败:', error.message);
    return null;
  }
}

// 模板文章生成
function generateWithTemplate(resourceInfo) {
  const templates = {
    电影: {
      title: `精选${resourceInfo.category}资源合集`,
      excerpt: `为${resourceInfo.category}爱好者整理的高质量资源分享，包含${resourceInfo.tags.join('、')}等多种优质内容。`,
      content: `# ${resourceInfo.category}资源分享

## 🎬 资源特色
- **高清画质**: 观影体验佳，画面清晰流畅
- **分类清晰**: 便于查找，节省宝贵时间
- **定期更新**: 保持内容新鲜度，持续提供优质资源
- **多元化内容**: 涵盖${resourceInfo.tags.join('、')}等多种类型

## 📱 使用说明
建议在良好的网络环境下使用，以获得最佳体验。支持多种设备访问，随时随地享受优质内容。

## 🎯 推荐理由
精心筛选的${resourceInfo.category}资源，注重质量与实用性的完美结合。每一份资源都经过仔细验证，确保为用户提供最佳体验。

## ⚖️ 免责声明
本站仅提供信息分享，不承担任何版权责任。请仅用于个人学习交流，支持正版内容创作。如有侵权问题，请及时联系删除。

## 📞 联系方式
如有任何问题或建议，欢迎通过网站联系方式与我们沟通交流。`,
      imagePrompt: "cinema abstract art, film reels, dark blue and purple theme"
    },
    软件: {
      title: `实用${resourceInfo.category}工具精选`,
      excerpt: `提升工作效率的实用${resourceInfo.category}工具合集，涵盖${resourceInfo.tags.join('、')}等实用功能。`,
      content: `# ${resourceInfo.category}工具分享

## 💻 工具特点
- **功能实用**: 解决实际工作需求，显著提升效率
- **操作简便**: 用户界面友好，新手也能快速上手
- **稳定可靠**: 经过充分测试验证，确保使用稳定性
- **持续更新**: 跟进技术发展，保持工具先进性

## 📦 使用建议
- 建议从官方渠道获取，确保软件安全性
- 使用前请仔细阅读相关说明文档
- 定期检查更新，获得最新功能体验
- 合理配置，发挥工具最大效用

## 🎯 适用场景
特别适合需要${resourceInfo.tags.join('、')}功能的用户群体，无论是个人使用还是团队协作，都能提供有效支持。

## ⚠️ 重要提醒
请支持正版软件开发，本分享仅供学习交流使用。使用过程中请遵守相关法律法规，尊重知识产权。

## 🔧 技术支持
如遇到使用问题，建议查阅官方文档或寻求专业技术支持，确保获得最佳使用体验。`,
      imagePrompt: "software development abstract, modern technology icons, blue gradient"
    },
    教育: {
      title: `优质${resourceInfo.category}资源整理`,
      excerpt: `涵盖${resourceInfo.tags.join('、')}等领域的优质${resourceInfo.category}资料，助力个人学习成长。`,
      content: `# ${resourceInfo.category}资源分享

## 📚 资源亮点
- **内容全面**: 涵盖${resourceInfo.tags.join('、')}等多个重要领域
- **质量上乘**: 精选优质教学材料，确保学习效果
- **结构清晰**: 便于系统化学习，循序渐进
- **实用性强**: 理论与实践相结合，学以致用

## 📖 学习建议
- 制定合理的学习计划，确保学习效率
- 结合实际项目练习，加深理解
- 定期复习已学内容，巩固知识基础
- 积极参与讨论交流，拓展思维视野

## 🎓 适用人群
适合对${resourceInfo.tags.join('、')}感兴趣的学习者，无论是初学者还是进阶用户，都能找到合适的学习内容。

## 🔒 使用说明
资源仅供个人学习研究使用，请尊重知识产权，支持正版教育内容。学习过程中如有疑问，建议寻求专业指导。

## 🌟 学习心得
持续学习是个人成长的关键，希望这些资源能为您的学习之路提供有力支持，助您在知识的海洋中不断前行。`,
      imagePrompt: "education and learning abstract, books and knowledge symbols, warm academic colors"
    }
  };

  const template = templates[resourceInfo.category] || templates.软件;

  return {
    title: template.title,
    excerpt: template.excerpt,
    content: template.content,
    tags: [...resourceInfo.tags, resourceInfo.category, '资源', '分享'],
    imagePrompt: template.imagePrompt
  };
}

// 主演示函数
async function demonstrateGeneration() {
  console.log('🎭 AI生成 vs 模板生成 完整对比演示\n');
  console.log('='.repeat(80));

  // 读取测试资源
  let testResource;
  try {
    const resourcesContent = fs.readFileSync('./resources.json', 'utf-8');
    const resources = JSON.parse(resourcesContent);
    testResource = resources[0]; // 使用第一个资源进行演示
  } catch (error) {
    // 如果没有resources.json，使用默认测试资源
    testResource = {
      title: "精选科幻影视合集",
      category: "电影",
      tags: ["科幻", "电影", "高清", "推荐"],
      description: "精选优质科幻影视作品合集，包含探索宇宙、时空穿越等主题的经典内容"
    };
  }

  console.log(`📝 测试资源信息:`);
  console.log(`   标题: ${testResource.title}`);
  console.log(`   分类: ${testResource.category}`);
  console.log(`   标签: ${testResource.tags.join(', ')}`);
  console.log(`   描述: ${testResource.description}\n`);

  // 百度AI生成
  console.log('🤖 百度AI生成结果:');
  console.log('-'.repeat(50));

  const aiContent = await generateWithBaiduAI(testResource);
  if (aiContent) {
    console.log(`✅ 标题: ${aiContent.title}`);
    console.log(`📝 摘要: ${aiContent.excerpt}`);
    console.log(`🏷️ 标签: ${aiContent.tags.join(', ')}`);
    console.log(`🖼️ 配图: ${aiContent.imagePrompt}`);
    console.log(`📖 正文预览:\n${aiContent.content.substring(0, 200)}...\n`);
  } else {
    console.log('❌ AI生成失败，将使用模板生成\n');
  }

  // 模板生成
  console.log('📋 模板生成结果:');
  console.log('-'.repeat(50));

  const templateContent = generateWithTemplate(testResource);
  console.log(`✅ 标题: ${templateContent.title}`);
  console.log(`📝 摘要: ${templateContent.excerpt}`);
  console.log(`🏷️ 标签: ${templateContent.tags.join(', ')}`);
  console.log(`🖼️ 配图: ${templateContent.imagePrompt}`);
  console.log(`📖 正文预览:\n${templateContent.content.substring(0, 200)}...\n`);

  // 显示完整的模板生成内容
  console.log('📄 模板生成完整文章内容:');
  console.log('='.repeat(80));
  console.log(`# ${templateContent.title}\n`);
  console.log(`**摘要**: ${templateContent.excerpt}\n`);
  console.log(`**标签**: ${templateContent.tags.join(' | ')}\n`);
  console.log(templateContent.content);
  console.log('\n' + '='.repeat(80));

  // 对比总结
  console.log('\n📊 生成方式对比:');
  console.log('🤖 AI生成优势:');
  console.log('   - ✅ 内容更个性化和多样化');
  console.log('   - ✅ 能理解上下文生成相关内容');
  console.log('   - ❌ 需要API密钥和网络请求');
  console.log('   - ❌ 可能有配额限制');

  console.log('\n📋 模板生成优势:');
  console.log('   - ✅ 无需API，立即可用');
  console.log('   - ✅ 速度快，稳定可靠');
  console.log('   - ✅ 内容质量稳定，SEO友好');
  console.log('   - ✅ 包含完整的免责声明');
  console.log('   - ❌ 内容相对固定');

  console.log('\n💡 建议:');
  if (aiContent) {
    console.log('   🎉 百度AI可用，建议优先使用AI生成获得更个性化内容');
  } else {
    console.log('   📋 当前建议使用模板生成，内容质量已经很好');
  }
  console.log('   🔄 可以混合使用：AI生成失败时自动回退到模板模式');
}

demonstrateGeneration().catch(console.error);