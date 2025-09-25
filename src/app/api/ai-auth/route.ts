// 强化的身份验证API - 修复安全漏洞
import { NextRequest, NextResponse } from 'next/server';

// 速率限制存储
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟
const MAX_AUTH_ATTEMPTS = 3; // 15分钟内最多3次尝试
const LOCKOUT_DURATION = 60 * 60 * 1000; // 锁定1小时

// Token存储和验证
const validTokens = new Map();
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // Token 24小时过期

interface RateLimit {
  attempts: number[];
  lockedUntil?: number;
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; lockedUntil?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip) || { attempts: [] } as RateLimit;

  // 检查是否被锁定
  if (userLimit.lockedUntil && now < userLimit.lockedUntil) {
    return {
      allowed: false,
      lockedUntil: userLimit.lockedUntil
    };
  }

  // 清理过期的尝试记录
  userLimit.attempts = userLimit.attempts.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (userLimit.attempts.length >= MAX_AUTH_ATTEMPTS) {
    // 触发锁定
    userLimit.lockedUntil = now + LOCKOUT_DURATION;
    rateLimitMap.set(ip, userLimit);
    return { allowed: false, lockedUntil: userLimit.lockedUntil };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_AUTH_ATTEMPTS - userLimit.attempts.length
  };
}

function recordAttempt(ip: string, success: boolean) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip) || { attempts: [] } as RateLimit;

  if (!success) {
    userLimit.attempts.push(now);
    rateLimitMap.set(ip, userLimit);
  } else {
    // 成功登录清除限制
    rateLimitMap.delete(ip);
  }
}

function generateSecureToken(ip: string): string {
  const payload = {
    type: 'ai-auth',
    ip: ip,
    issued: Date.now(),
    expires: Date.now() + TOKEN_EXPIRY,
    random: Math.random().toString(36)
  };

  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
  validTokens.set(token, payload);

  // 清理过期token
  setTimeout(() => validTokens.delete(token), TOKEN_EXPIRY);

  return token;
}

export function verifyToken(token: string): { valid: boolean; ip?: string } {
  if (!token) return { valid: false };

  const payload = validTokens.get(token);
  if (!payload) return { valid: false };

  // 检查是否过期
  if (Date.now() > payload.expires) {
    validTokens.delete(token);
    return { valid: false };
  }

  return { valid: true, ip: payload.ip };
}

export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0] || request.ip || 'unknown';

    // 速率限制检查
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      console.warn(`🚨 认证被锁定 - IP: ${clientIp}, 锁定至: ${new Date(rateCheck.lockedUntil!)}`);

      const waitMinutes = Math.ceil((rateCheck.lockedUntil! - Date.now()) / (60 * 1000));
      return NextResponse.json({
        success: false,
        error: `认证失败次数过多，请${waitMinutes}分钟后重试`,
        lockedUntil: rateCheck.lockedUntil
      }, { status: 429 });
    }

    const { password } = await request.json();

    // 输入验证
    if (!password || typeof password !== 'string') {
      recordAttempt(clientIp, false);
      return NextResponse.json({
        success: false,
        error: '无效的请求参数'
      }, { status: 400 });
    }

    // 从环境变量读取密码
    const correctPassword = process.env.BOSS_AI_PASSWORD;

    if (!correctPassword) {
      console.error('❌ 环境变量BOSS_AI_PASSWORD未设置');
      return NextResponse.json({
        success: false,
        error: '服务器配置错误'
      }, { status: 500 });
    }

    if (password === correctPassword) {
      // 生成安全token
      const token = generateSecureToken(clientIp);
      recordAttempt(clientIp, true);

      console.log(`✅ AI认证成功 - IP: ${clientIp}`);

      return NextResponse.json({
        success: true,
        token: token,
        message: '认证成功',
        expiresIn: TOKEN_EXPIRY
      });
    } else {
      recordAttempt(clientIp, false);

      const remainingAttempts = MAX_AUTH_ATTEMPTS - (rateLimitMap.get(clientIp)?.attempts.length || 0);
      console.warn(`❌ AI认证失败 - IP: ${clientIp}, 剩余尝试: ${remainingAttempts}`);

      return NextResponse.json({
        success: false,
        error: `密码错误，剩余尝试次数: ${remainingAttempts}`,
        remainingAttempts
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

// 禁用GET方法，防止信息泄露
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed'
  }, { status: 405 });
}