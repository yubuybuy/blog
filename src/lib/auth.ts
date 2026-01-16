// 安全认证工具库
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('🔒 安全错误: JWT_SECRET 环境变量未设置！请在 .env.local 中配置 JWT_SECRET');
}
const JWT_EXPIRES_IN = '24h'; // Token 24小时过期

// 密码哈希轮数（越高越安全，但越慢）
const SALT_ROUNDS = 12;

/**
 * 哈希密码
 * @param password 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param password 用户输入的明文密码
 * @param hashedPassword 存储的哈希密码
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('密码验证错误:', error);
    return false;
  }
}

/**
 * 生成 JWT Token
 * @param payload Token 载荷数据
 * @returns JWT Token 字符串
 */
export function generateToken(payload: { userId: string; username: string }): string {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'netdisk-blog',
    audience: 'boss-admin',
  });
}

/**
 * 验证 JWT Token
 * @param token JWT Token 字符串
 * @returns 解码后的载荷，如果无效返回 null
 */
export function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string, {
      issuer: 'netdisk-blog',
      audience: 'boss-admin',
    }) as { userId: string; username: string };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token 已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Token 无效');
    }
    return null;
  }
}

/**
 * 速率限制存储（内存版，生产环境建议使用 Redis）
 */
const loginAttempts = new Map<string, { count: number; resetTime: number; lockedUntil?: number }>();

const MAX_LOGIN_ATTEMPTS = 5; // 最多尝试次数
const LOCK_TIME = 15 * 60 * 1000; // 锁定15分钟
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5分钟内的尝试

/**
 * 检查是否被锁定
 * @param identifier 识别符（通常是IP地址）
 * @returns { locked: boolean, remainingTime?: number }
 */
export function checkRateLimit(identifier: string): {
  locked: boolean;
  remainingTime?: number;
  attemptsLeft?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  // 检查是否被锁定
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      locked: true,
      remainingTime: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // 检查是否需要重置计数
  if (record.resetTime < now) {
    loginAttempts.delete(identifier);
    return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  return {
    locked: false,
    attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - record.count),
  };
}

/**
 * 记录登录失败
 * @param identifier 识别符（通常是IP地址）
 */
export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || record.resetTime < now) {
    // 新建或重置记录
    loginAttempts.set(identifier, {
      count: 1,
      resetTime: now + ATTEMPT_WINDOW,
    });
  } else {
    // 增加失败计数
    record.count += 1;

    // 如果超过最大尝试次数，锁定账户
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = now + LOCK_TIME;
      console.warn(`⚠️ IP ${identifier} 已被锁定 ${LOCK_TIME / 60000} 分钟`);
    }

    loginAttempts.set(identifier, record);
  }
}

/**
 * 重置登录尝试记录（登录成功时调用）
 * @param identifier 识别符
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * 从请求中提取客户端标识符（IP + User-Agent）
 * @param request Next.js 请求对象
 * @returns 客户端唯一标识符
 */
export function getClientIdentifier(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] || headers.get('x-real-ip') || 'unknown';
  const userAgent = headers.get('user-agent') || 'unknown';

  // 组合 IP 和 User-Agent 的哈希作为标识符
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * 验证 API 请求的 JWT 认证
 * @param request Next.js 请求对象
 * @returns { authenticated: boolean, user?: any, error?: string }
 */
export function authenticateRequest(request: Request): {
  authenticated: boolean;
  user?: { userId: string; username: string };
  error?: string;
} {
  try {
    // 从 Authorization 头获取 token
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return { authenticated: false, error: '缺少认证令牌' };
    }

    // 检查格式是否为 "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return { authenticated: false, error: '认证令牌格式错误' };
    }

    const token = parts[1];

    // 验证 token
    const payload = verifyToken(token);

    if (!payload) {
      return { authenticated: false, error: '令牌无效或已过期' };
    }

    return { authenticated: true, user: payload };
  } catch (error) {
    console.error('认证错误:', error);
    return { authenticated: false, error: '认证失败' };
  }
}
