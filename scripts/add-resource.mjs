/**
 * 资源快速录入工具 - 命令行版
 * 使用方法: node scripts/add-resource.mjs
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// 资源数据库文件
const RESOURCES_FILE = path.join(__dirname, '..', 'resources-database.json');

// 读取现有资源
function loadResources() {
  if (fs.existsSync(RESOURCES_FILE)) {
    return JSON.parse(fs.readFileSync(RESOURCES_FILE, 'utf8'));
  }
  return [];
}

// 保存资源
function saveResources(resources) {
  fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2));
}

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 获取分类列表
async function getCategories() {
  const categories = await client.fetch('*[_type == "category"]{title, slug}');
  return categories;
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('📦 资源快速录入工具');
  console.log('='.repeat(60));
  console.log('');

  // 获取分类
  const categories = await getCategories();
  console.log('可用分类:');
  categories.forEach((cat, index) => {
    console.log(`  ${index + 1}. ${cat.title}`);
  });
  console.log('');

  // 收集资源信息
  const resource = {};

  resource.title = await question('📝 资源名称: ');

  const categoryIndex = await question(`📁 分类 (1-${categories.length}): `);
  resource.category = categories[parseInt(categoryIndex) - 1]?.title || '其他';

  resource.downloadLink = await question('🔗 网盘链接: ');
  resource.extractCode = await question('🔑 提取码 (可选): ');
  resource.description = await question('📄 资源描述: ');

  const tagsInput = await question('🏷️  标签 (用逗号分隔): ');
  resource.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

  const sourceInput = await question('🌐 来源 (贴吧/QQ频道/网站/其他): ');
  resource.source = sourceInput || '未知';

  const priorityInput = await question('⭐ 优先级 (1-5星): ');
  resource.priority = parseInt(priorityInput) || 3;

  resource.notes = await question('📌 备注 (可选): ');

  // 自动添加的信息
  resource.id = `RES-${Date.now()}`;
  resource.collectedAt = new Date().toISOString();
  resource.status = '待发布';
  resource.linkStatus = '未检查';

  console.log('');
  console.log('='.repeat(60));
  console.log('📋 资源信息预览');
  console.log('='.repeat(60));
  console.log(JSON.stringify(resource, null, 2));
  console.log('');

  const confirm = await question('确认保存? (y/n): ');

  if (confirm.toLowerCase() === 'y') {
    // 加载现有资源
    const resources = loadResources();
    resources.push(resource);
    saveResources(resources);

    console.log('');
    console.log('✅ 资源已保存!');
    console.log(`📊 当前资源库共有 ${resources.length} 个资源`);
    console.log('');
  } else {
    console.log('❌ 已取消');
  }

  const continueInput = await question('继续添加? (y/n): ');

  rl.close();

  if (continueInput.toLowerCase() === 'y') {
    // 重新启动
    main();
  } else {
    console.log('');
    console.log('💡 下一步:');
    console.log('  1. 查看资源库: cat resources-database.json');
    console.log('  2. 批量发布: node scripts/batch-publish.mjs');
    console.log('  3. 检查链接: node scripts/check-links.mjs');
    console.log('');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ 错误:', error);
  rl.close();
  process.exit(1);
});
