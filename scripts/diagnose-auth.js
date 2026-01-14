#!/usr/bin/env node

/**
 * 完整的认证系统诊断工具
 * 测试环境变量和认证逻辑
 */

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 加载 .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env.local') });

async function diagnoseAuth() {
  console.log('\n🔍 认证系统完整诊断\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. 检查环境变量
  console.log('1️⃣ 检查环境变量：\n');

  const hashedPassword = process.env.BOSS_PASSWORD_HASH;
  const plainPassword = process.env.BOSS_AI_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  console.log('BOSS_PASSWORD_HASH 存在:', !!hashedPassword);
  if (hashedPassword) {
    console.log('  值:', hashedPassword.substring(0, 30) + '...');
  }

  console.log('BOSS_AI_PASSWORD 存在:', !!plainPassword);
  if (plainPassword) {
    console.log('  值:', plainPassword);
  }

  console.log('JWT_SECRET 存在:', !!jwtSecret);
  if (jwtSecret) {
    console.log('  值:', jwtSecret.substring(0, 20) + '...');
  }

  // 2. 测试密码验证
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('2️⃣ 测试密码验证逻辑：\n');

  const testPassword = 'GYX@gbx2026.';
  console.log('测试密码:', testPassword);

  if (hashedPassword) {
    console.log('\n使用 BOSS_PASSWORD_HASH 验证：');
    try {
      const isValid = await bcrypt.compare(testPassword, hashedPassword);
      console.log(isValid ? '  ✅ 匹配成功！' : '  ❌ 匹配失败！');
    } catch (error) {
      console.log('  ❌ 错误:', error.message);
    }
  }

  if (plainPassword) {
    console.log('\n使用 BOSS_AI_PASSWORD 验证（兼容模式）：');
    const isValid = testPassword === plainPassword;
    console.log(isValid ? '  ✅ 匹配成功！' : '  ❌ 匹配失败！');
    console.log('  明文密码:', plainPassword);
    console.log('  测试密码:', testPassword);
  }

  // 3. 模拟 API 逻辑
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('3️⃣ 模拟 API 认证逻辑：\n');

  if (!hashedPassword) {
    console.log('⚠️  没有 BOSS_PASSWORD_HASH，会降级到兼容模式');
    if (plainPassword && testPassword === plainPassword) {
      console.log('✅ 兼容模式验证成功！');
    } else {
      console.log('❌ 兼容模式验证失败！');
    }
  } else {
    console.log('✅ 有 BOSS_PASSWORD_HASH，使用 bcrypt 验证');
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    if (isValid) {
      console.log('✅ bcrypt 验证成功！');
    } else {
      console.log('❌ bcrypt 验证失败！');
      console.log('   尝试降级到兼容模式...');
      if (plainPassword && testPassword === plainPassword) {
        console.log('   ✅ 兼容模式验证成功！');
      } else {
        console.log('   ❌ 兼容模式也失败！');
      }
    }
  }

  // 4. 总结
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('4️⃣ 诊断总结：\n');

  if (hashedPassword) {
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    if (isValid) {
      console.log('✅ 密码和哈希匹配，理论上应该可以登录');
      console.log('   如果实际登录失败，可能原因：');
      console.log('   1. 前端发送的密码被修改（空格、编码等）');
      console.log('   2. 服务器缓存了旧代码');
      console.log('   3. 环境变量没有重新加载');
      console.log('\n   建议：完全重启服务器（Ctrl+C 然后 npm run dev）');
    } else {
      console.log('❌ 密码和哈希不匹配');
      console.log('   需要重新生成密码哈希');
    }
  } else {
    console.log('⚠️  没有配置密码哈希');
    console.log('   系统会使用兼容模式（不安全）');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

diagnoseAuth();
