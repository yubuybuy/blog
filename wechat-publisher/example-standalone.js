/**
 * 独立使用示例
 * 演示如何不依赖Sanity,直接发布文章到公众号
 */

import WeChatPublisher from './wechat-publisher.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// 配置
const config = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'
};

// 创建发布器实例
const publisher = new WeChatPublisher(config);

// 示例文章数据
const sampleArticle = {
  title: '精选办公软件工具包 - 提升效率必备',
  slug: 'office-software-collection',
  excerpt: '为职场人士精心整理的办公软件合集,包含多个实用工具,助力提升工作效率。',
  content: `
## 资源介绍

本合集包含多款实用的办公软件工具,涵盖文档编辑、数据处理、团队协作等多个方面。

## 资源特色

- **高质量精选**: 每款软件都经过精心筛选
- **实用性强**: 贴合日常办公需求
- **易于上手**: 操作简单,快速提升效率
- **持续更新**: 定期更新维护

## 适用人群

- 职场办公人员
- 学生群体
- 自由职业者
- 创业团队

## 使用建议

1. 根据实际需求选择合适的工具
2. 建议先在测试环境试用
3. 定期更新到最新版本
4. 注意数据备份

## 注意事项

- 请遵守软件许可协议
- 仅供学习交流使用
- 商业使用请购买正版
  `,
  author: {
    name: 'AI小白'
  },
  mainImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
  netdiskLinks: [
    'https://pan.quark.cn/s/xxxxx',
    'https://pan.baidu.com/s/yyyyy'
  ]
};

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('📝 独立发布示例');
  console.log('='.repeat(60));

  try {
    // 方式1: 仅创建草稿
    console.log('\n方式1: 创建草稿\n');
    const draftResult = await publisher.publish(sampleArticle, false);

    if (draftResult.success) {
      console.log('✅ 草稿创建成功!');
      console.log(`   Media ID: ${draftResult.mediaId}`);
      console.log('   请到公众号后台查看并手动发布');
    } else {
      console.log('❌ 创建失败:', draftResult.error);
    }

    // 方式2: 自动发布(取消注释以启用)
    /*
    console.log('\n方式2: 自动发布\n');
    const publishResult = await publisher.publish(sampleArticle, true);

    if (publishResult.success) {
      console.log('✅ 文章发布成功!');
      console.log(`   Media ID: ${publishResult.mediaId}`);
      console.log(`   Message ID: ${publishResult.msgId}`);
    } else {
      console.log('❌ 发布失败:', publishResult.error);
    }
    */

  } catch (error) {
    console.error('\n❌ 发生错误:', error);
  }

  console.log('\n' + '='.repeat(60));
}

// 运行示例
main();
