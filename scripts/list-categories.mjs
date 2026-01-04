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

async function listCategories() {
  try {
    console.log('正在查询所有分类...\n');

    const categories = await client.fetch(`
      *[_type == "category"] | order(title asc) {
        _id,
        title,
        "slug": slug.current,
        description,
        "postCount": count(*[_type == "post" && references(^._id)]),
        "lastPost": *[_type == "post" && references(^._id)] | order(publishedAt desc)[0]{
          title,
          publishedAt
        }
      }
    `);

    console.log(`找到 ${categories.length} 个分类：\n`);
    console.log('='.repeat(80));

    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.title} (${cat.slug})`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   文章数量: ${cat.postCount} 篇`);
      if (cat.description) {
        console.log(`   描述: ${cat.description}`);
      }
      if (cat.lastPost) {
        const date = new Date(cat.lastPost.publishedAt).toLocaleDateString('zh-CN');
        console.log(`   最新文章: ${cat.lastPost.title} (${date})`);
      } else {
        console.log(`   ⚠️  该分类下暂无文章`);
      }
      console.log('-'.repeat(80));
    });

    console.log('\n统计信息：');
    console.log(`总分类数: ${categories.length}`);
    console.log(`有文章的分类: ${categories.filter(c => c.postCount > 0).length}`);
    console.log(`空分类: ${categories.filter(c => c.postCount === 0).length}`);

  } catch (error) {
    console.error('查询失败:', error);
  }
}

listCategories();
