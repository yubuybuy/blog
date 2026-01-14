#!/usr/bin/env node

/**
 * 密码哈希验证工具
 * 用于测试密码和哈希是否匹配
 */

import bcrypt from 'bcrypt';

async function verifyPassword() {
  // 你的密码
  const password = 'GYX@gbx2026.';

  // 你的哈希
  const hash = '$2b$12$UXxi8zKKc6hpYw55bQ/p7uQipnsxT/ZdEzptijXB49rTohv9GkNEa';

  console.log('\n🔐 密码验证测试\n');
  console.log('测试密码:', password);
  console.log('密码长度:', password.length);
  console.log('哈希值:', hash);
  console.log('\n正在验证...\n');

  try {
    const isMatch = await bcrypt.compare(password, hash);

    if (isMatch) {
      console.log('✅ 成功！密码和哈希匹配！');
      console.log('   → 密码应该可以正常登录');
      console.log('   → 如果登录失败，可能是其他问题\n');
    } else {
      console.log('❌ 失败！密码和哈希不匹配！');
      console.log('   → 这说明生成哈希时输入的密码不是 GYX@gbx2026.');
      console.log('   → 需要重新生成新的密码哈希\n');
    }

    // 测试几个常见的变体
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('测试常见的输入错误：\n');

    const variants = [
      'GYX@gbx2026',     // 没有最后的点
      'GYX@gbx2026. ',   // 后面有空格
      ' GYX@gbx2026.',   // 前面有空格
      'gyx@gbx2026.',    // 小写
    ];

    for (const variant of variants) {
      const match = await bcrypt.compare(variant, hash);
      console.log(`${match ? '✅' : '❌'} "${variant}"`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
  }
}

verifyPassword();
