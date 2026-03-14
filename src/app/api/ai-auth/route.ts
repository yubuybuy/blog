// 安全的身份验证API - 使用 JWT + 密码哈希 + 速率限制
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  generateToken,
  verifyToken,
  checkRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  getClientIdentifier,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password, action } = await request.json();

    // 获取客户端标识符（用于速率限制）
    const clientId = getClientIdentifier(request);

    // 如果是验证 token 的请求
    if (action === 'verify') {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({
          success: false,
          error: '缺少认证令牌'
        }, { status: 401 });
      }

      const payload = verifyToken(token);
      if (payload) {
        return NextResponse.json({
          success: true,
          user: payload
        });
      } else {
        return NextResponse.json({
          success: false,
          error: '令牌无效或已过期'
        }, { status: 401 });
      }
    }

    // 登录请求 - 检查速率限制
    const rateLimitCheck = checkRateLimit(clientId);
    if (rateLimitCheck.locked) {
      return NextResponse.json({
        success: false,
        error: `登录尝试过多，请 ${rateLimitCheck.remainingTime} 秒后再试`,
        lockedUntil: rateLimitCheck.remainingTime
      }, { status: 429 });
    }

    // 从环境变量读取哈希后的密码
    const hashedPassword = process.env.BOSS_PASSWORD_HASH;
    const plainPassword = process.env.BOSS_AI_PASSWORD;

    if (!hashedPassword && !plainPassword) {
      console.error('BOSS_PASSWORD_HASH 或 BOSS_AI_PASSWORD 环境变量未设置');
      return NextResponse.json({
        success: false,
        error: '服务器配置错误，请联系管理员'
      }, { status: 500 });
    }

    // 验证密码：优先使用哈希比对，回退到明文比对
    let isValid = false;
    if (hashedPassword) {
      isValid = await verifyPassword(password, hashedPassword);
    } else if (plainPassword) {
      console.warn('⚠️ 使用明文密码验证，请尽快设置 BOSS_PASSWORD_HASH 环境变量');
      isValid = password === plainPassword;
    }

    if (isValid) {
      // 密码正确 - 重置失败计数
      resetLoginAttempts(clientId);

      // 生成 JWT Token
      const token = generateToken({
        userId: 'boss-admin',
        username: process.env.BOSS_USERNAME || 'admin'
      });

      return NextResponse.json({
        success: true,
        token: token,
        message: '验证成功',
        expiresIn: '24h'
      });
    } else {
      // 密码错误 - 记录失败尝试
      recordFailedLogin(clientId);

      const remainingAttempts = checkRateLimit(clientId);
      console.log(`❌ 登录失败 - 标识: ${clientId.substring(0, 30)}... - 剩余尝试: ${remainingAttempts.attemptsLeft}`);

      return NextResponse.json({
        success: false,
        error: '密码错误',
        attemptsLeft: remainingAttempts.attemptsLeft
      }, { status: 401 });
    }

  } catch (error) {
    console.error('AI认证API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 });
  }
}

// GET方法用于检查API状态
export async function GET() {
  return NextResponse.json({
    status: 'AI认证API正常运行',
    timestamp: new Date().toISOString()
  });
}