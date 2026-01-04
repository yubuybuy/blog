import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// 要保留的分类（通过ID）
const KEEP_CATEGORIES = {
  'e35JbV65I3hYivFZ2yOTpj': { keep: true, rename: false },  // 电影
  '72CnA24vS9SzSXSoN0yX7D': { keep: true, rename: false },  // 电视剧
  'vw15XiQ11GE6vh1QnVpo1N': { keep: true, rename: false },  // 软件
  '8zOK5U5ScprlNDd8iwFnsc': { keep: true, rename: true, newTitle: '知识分享', newSlug: 'knowledge', newDescription: '小学学习资料、教育资源、知识分享' },  // 教育 -> 知识分享
  '72CnA24vS9SzSXSoN0yXCF': { keep: true, rename: false }   // 其他
};

async function manageCategories() {
  try {
    console.log('正在查询所有分类...\n');

    const categories = await client.fetch(`
      *[_type == "category"] {
        _id,
        title,
        "slug": slug.current
      }
    `);

    console.log(`找到 ${categories.length} 个分类\n`);

    // 1. 重命名"教育"为"知识分享"
    console.log('步骤 1: 重命名分类');
    console.log('='.repeat(60));
    for (const cat of categories) {
      const config = KEEP_CATEGORIES[cat._id];
      if (config && config.rename) {
        console.log(`正在重命名: ${cat.title} -> ${config.newTitle}`);
        await client
          .patch(cat._id)
          .set({
            title: config.newTitle,
            slug: { _type: 'slug', current: config.newSlug },
            description: config.newDescription
          })
          .commit();
        console.log(`✅ 已重命名: ${config.newTitle} (${config.newSlug})\n`);
      }
    }

    // 2. 删除不需要的分类
    console.log('\n步骤 2: 删除不需要的分类');
    console.log('='.repeat(60));

    let deletedCount = 0;
    for (const cat of categories) {
      if (!KEEP_CATEGORIES[cat._id]) {
        console.log(`正在删除: ${cat.title} (${cat.slug})`);
        await client.delete(cat._id);
        console.log(`✅ 已删除\n`);
        deletedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('操作完成！');
    console.log(`保留分类: ${Object.keys(KEEP_CATEGORIES).length} 个`);
    console.log(`删除分类: ${deletedCount} 个`);

    // 3. 显示最终分类列表
    console.log('\n最终分类列表：');
    console.log('='.repeat(60));
    const finalCategories = await client.fetch(`
      *[_type == "category"] | order(title asc) {
        title,
        "slug": slug.current,
        description
      }
    `);

    finalCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.title} (${cat.slug})`);
      if (cat.description) {
        console.log(`   ${cat.description}`);
      }
    });

  } catch (error) {
    console.error('操作失败:', error);
  }
}

manageCategories();
