#!/usr/bin/env node

/**
 * 密码哈希生成工具（简化版 - Windows 友好）
 *
 * 使用方法:
 * node scripts/generate-password-hash-simple.js 你的密码
 *
 * 例如:
 * node scripts/generate-password-hash-simple.js MySecure@Pass2026!
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

async function main() {
  // 从命令行参数获取密码
  const password = process.argv[2];

  if (!password) {
    console.log('\n🔐 密码哈希生成工具（简化版）\n');
    console.log('使用方法:');
    console.log('  node scripts/generate-password-hash-simple.js 你的密码\n');
    console.log('密码强度建议：');
    console.log('  ✓ 至少 12 位字符');
    console.log('  ✓ 包含大写字母 (A-Z)');
    console.log('  ✓ 包含小写字母 (a-z)');
    console.log('  ✓ 包含数字 (0-9)');
    console.log('  ✓ 包含特殊字符 (!@#$%^&*)\n');
    console.log('示例:');
    console.log('  node scripts/generate-password-hash-simple.js MySecure@Pass2026!\n');
    process.exit(1);
  }

  try {
    // 检查密码强度
    const passwordStrength = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    console.log('\n密码强度检查:');
    console.log(`  ${passwordStrength.length ? '✓' : '✗'} 长度 >= 12 位 (当前: ${password.length})`);
    console.log(`  ${passwordStrength.uppercase ? '✓' : '✗'} 包含大写字母`);
    console.log(`  ${passwordStrength.lowercase ? '✓' : '✗'} 包含小写字母`);
    console.log(`  ${passwordStrength.number ? '✓' : '✗'} 包含数字`);
    console.log(`  ${passwordStrength.special ? '✓' : '✗'} 包含特殊字符`);

    const isStrong = Object.values(passwordStrength).every(v => v === true);
    if (!isStrong) {
      console.log('\n⚠️  密码强度较弱，但仍将生成哈希。强烈建议使用更强的密码！');
    } else {
      console.log('\n✅ 密码强度良好！');
    }

    // 生成哈希
    console.log('\n🔄 正在生成密码哈希...');
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    console.log('\n✅ 密码哈希生成成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('请将以下内容添加到你的 .env.local 文件中：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`BOSS_PASSWORD_HASH=${hash}`);

    // 生成 JWT Secret
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    console.log(`JWT_SECRET=${jwtSecret}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 配置步骤：');
    console.log('  1. 复制上面的两行内容');
    console.log('  2. 打开 .env.local 文件');
    console.log('  3. 添加或替换这两个环境变量');
    console.log('  4. 保存文件');
    console.log('  5. 重启开发服务器 (npm run dev)');
    console.log('  6. 使用你的新密码登录管理后台\n');

    console.log('🔒 安全提示：');
    console.log('  - 不要将 .env.local 文件提交到 Git');
    console.log('  - 不要分享密码哈希或 JWT 密钥');
    console.log('  - 定期更换密码（建议每 3-6 个月）\n');

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    process.exit(1);
  }
}

main();
