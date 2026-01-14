#!/usr/bin/env node

/**
 * 密码哈希生成工具
 * 用于生成安全的 bcrypt 密码哈希
 *
 * 使用方法:
 * 1. 直接运行: node scripts/generate-password-hash.js
 * 2. 输入你的密码（建议至少12位，包含大小写字母、数字和特殊字符）
 * 3. 复制生成的哈希值到 .env.local 文件中的 BOSS_PASSWORD_HASH
 */

import bcrypt from 'bcrypt';
import readline from 'readline';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

console.log('\n🔐 密码哈希生成工具\n');
console.log('密码强度建议：');
console.log('  ✓ 至少 12 位字符');
console.log('  ✓ 包含大写字母 (A-Z)');
console.log('  ✓ 包含小写字母 (a-z)');
console.log('  ✓ 包含数字 (0-9)');
console.log('  ✓ 包含特殊字符 (!@#$%^&*)\n');

// 隐藏密码输入
function hideInput(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');

    let password = '';
    process.stdout.write(query);

    stdin.on('data', function listener(char) {
      char = char.toString('utf8');

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', listener);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(query + '*'.repeat(password.length));
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function main() {
  try {
    // 获取密码输入
    const password = await hideInput('请输入新密码: ');
    const confirmPassword = await hideInput('请再次输入密码确认: ');

    // 验证密码
    if (!password || password.trim() === '') {
      console.error('❌ 密码不能为空');
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error('❌ 两次输入的密码不一致');
      process.exit(1);
    }

    // 检查密码强度
    const passwordStrength = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    console.log('\n密码强度检查:');
    console.log(`  ${passwordStrength.length ? '✓' : '✗'} 长度 >= 12 位`);
    console.log(`  ${passwordStrength.uppercase ? '✓' : '✗'} 包含大写字母`);
    console.log(`  ${passwordStrength.lowercase ? '✓' : '✗'} 包含小写字母`);
    console.log(`  ${passwordStrength.number ? '✓' : '✗'} 包含数字`);
    console.log(`  ${passwordStrength.special ? '✓' : '✗'} 包含特殊字符`);

    const isStrong = Object.values(passwordStrength).every(v => v === true);
    if (!isStrong) {
      console.log('\n⚠️  密码强度较弱，但仍将生成哈希。强烈建议使用更强的密码！');
    }

    // 生成哈希
    console.log('\n🔄 正在生成密码哈希...');
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    console.log('\n✅ 密码哈希生成成功！\n');
    console.log('请将以下内容添加到你的 .env.local 文件中：\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`BOSS_PASSWORD_HASH=${hash}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 生成 JWT Secret 建议
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    console.log('同时建议添加以下 JWT 密钥（用于 Token 签名）：\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 配置步骤：');
    console.log('  1. 复制上面的两行内容');
    console.log('  2. 添加到 .env.local 文件');
    console.log('  3. 重启开发服务器 (npm run dev)');
    console.log('  4. 使用新密码登录管理后台\n');

    console.log('🔒 安全提示：');
    console.log('  - 不要将 .env.local 文件提交到 Git');
    console.log('  - 不要分享密码哈希或 JWT 密钥');
    console.log('  - 定期更换密码（建议每 3-6 个月）\n');

    rl.close();
  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    process.exit(1);
  }
}

main();
