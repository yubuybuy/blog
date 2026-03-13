// 测试模板模式文章生成
import fs from 'fs';

// 增强的模板服务
class AdvancedTemplateService {
  generateContent(resourceInfo) {
    const templates = {
      电影: [
        {
          title: "精选影视资源合集",
          excerpt: "为影视爱好者整理的高质量资源分享，包含多种类型优质内容。",
          content: `# 影视资源分享

## 🎬 资源特色
- **高清画质**: 观影体验佳，画面清晰流畅
- **分类清晰**: 便于查找，节省时间
- **定期更新**: 保持新鲜度，持续优质内容

## 📱 使用说明
建议在良好网络环境下观看，获得最佳体验。支持多种设备播放。

## ⚖️ 免责声明
本站仅提供信息分享，不承担任何版权责任。请仅用于个人学习交流，支持正版内容。如有侵权，请联系删除。`,
          imagePrompt: "cinema abstract art, film reels, dark blue theme"
        },
        {
          title: "影视内容精选推荐",
          excerpt: "优质影视内容资源整理，精心筛选的视觉盛宴等你发现。",
          content: `# 🎭 影视内容推荐

## ✨ 精选特点
- **内容丰富**: 涵盖各类题材，满足不同喜好
- **品质保证**: 精心筛选，确保观看价值
- **更新及时**: 跟进热门，紧跟潮流

## 🎯 观看建议
- 选择合适的观看时间和环境
- 根据个人喜好选择内容类型
- 建议与朋友分享观影体验

## 📝 版权说明
所有内容仅供学习交流使用，请支持正版，尊重创作者权益。`,
          imagePrompt: "movie poster style, abstract cinema elements, colorful"
        }
      ],
      软件: [
        {
          title: "实用软件工具精选",
          excerpt: "提升工作效率的实用软件工具合集，经过测试验证的优质资源。",
          content: `# 💻 软件工具分享

## 🛠️ 工具特点
- **功能实用**: 解决实际需求，提升效率
- **操作简便**: 用户友好，易于上手
- **稳定可靠**: 经过测试，确保可用性

## 📦 安装建议
- 请从官方渠道下载，确保安全性
- 安装前建议关闭杀毒软件避免误报
- 定期更新以获得最佳体验

## ⚠️ 免责声明
请支持正版软件，本分享仅供学习交流。使用软件请遵守相关法律法规。`,
          imagePrompt: "software icons abstract, technology theme, modern design"
        }
      ],
      教育: [
        {
          title: "学习资源精选合集",
          excerpt: "涵盖多个领域的优质学习资料，助力个人成长和技能提升。",
          content: `# 📚 学习资源分享

## 🎓 资源亮点
- **内容全面**: 涵盖多个学科领域
- **质量上乘**: 精选优质教学材料
- **结构清晰**: 便于系统化学习

## 📖 学习建议
- 制定合理的学习计划
- 结合实践加深理解
- 定期复习巩固知识

## 🔒 使用说明
资源仅供个人学习使用，请尊重知识产权，支持正版教育内容。`,
          imagePrompt: "education abstract, books and knowledge, warm colors"
        }
      ]
    };

    const categoryTemplates = templates[resourceInfo.category] || templates.软件;
    const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

    // 添加随机元素增加多样性
    const variations = {
      title: [
        template.title,
        template.title.replace('精选', '优质'),
        template.title.replace('合集', '推荐'),
        template.title.replace('分享', '整理')
      ],
      excerpt: [
        template.excerpt,
        template.excerpt.replace('高质量', '精品'),
        template.excerpt.replace('优质', '优秀')
      ]
    };

    return {
      title: variations.title[Math.floor(Math.random() * variations.title.length)],
      excerpt: variations.excerpt[Math.floor(Math.random() * variations.excerpt.length)],
      content: template.content,
      tags: resourceInfo.tags.length > 0 ? resourceInfo.tags : ['资源', '分享', resourceInfo.category],
      imagePrompt: template.imagePrompt
    };
  }
}

// 测试模板生成
function testTemplateGeneration() {
  console.log('🎨 测试模板模式文章生成...\n');

  const templateService = new AdvancedTemplateService();

  // 读取 resources.json 中的资源进行测试
  let resources = [];
  try {
    const resourcesContent = fs.readFileSync('./resources.json', 'utf-8');
    resources = JSON.parse(resourcesContent);
  } catch (error) {
    console.log('未找到 resources.json，使用默认测试资源');
    resources = [
      {
        title: "科幻影视合集",
        category: "电影",
        tags: ["科幻", "电影", "高清"],
        description: "精选科幻影视作品"
      },
      {
        title: "办公软件工具",
        category: "软件",
        tags: ["办公", "效率", "工具"],
        description: "提升工作效率的软件工具"
      }
    ];
  }

  resources.slice(0, 2).forEach((resource, index) => {
    console.log(`📄 生成文章 ${index + 1}:`);
    console.log(`资源: ${resource.title} (${resource.category})`);

    const content = templateService.generateContent(resource);

    console.log(`✅ 标题: ${content.title}`);
    console.log(`📝 摘要: ${content.excerpt}`);
    console.log(`🏷️ 标签: ${content.tags.join(', ')}`);
    console.log(`🖼️ 配图: ${content.imagePrompt}`);
    console.log(`📖 内容预览: ${content.content.substring(0, 100)}...`);
    console.log('---\n');
  });

  console.log('🎉 模板模式测试完成！');
  console.log('\n💡 优势:');
  console.log('- ✅ 无需API密钥，立即可用');
  console.log('- ✅ 内容质量高，符合SEO要求');
  console.log('- ✅ 每次生成内容略有不同，避免重复');
  console.log('- ✅ 包含免责声明，规避版权风险');
}

testTemplateGeneration();