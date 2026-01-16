// Next.js 安全中间件 - 添加全局安全响应头
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // 克隆响应以添加自定义头
  const response = NextResponse.next();

  // 🛡️ 安全响应头配置

  // 1. Content Security Policy (CSP) - 防止 XSS 攻击
  // 允许从可信来源加载资源
  const cspDirectives = [
    "default-src 'self'",
    // script-src: 限制脚本来源，移除 unsafe-eval，保留 unsafe-inline（Next.js 需要）
    "script-src 'self' 'unsafe-inline' https://cdn.sanity.io https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://cdn.sanity.io https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.sanity.io",
    "connect-src 'self' https://api.sanity.io https://*.sanity.io https://generativelanguage.googleapis.com https://api.cohere.ai https://api.themoviedb.org https://image.tmdb.org",
    "frame-src 'self' https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
    // 添加 worker-src 和 manifest-src 安全策略
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // 2. X-Frame-Options - 防止点击劫持
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // 3. X-Content-Type-Options - 防止 MIME 类型嗅探
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 4. Referrer-Policy - 控制 Referer 信息泄露
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Permissions-Policy - 限制浏览器功能访问
  const permissionsPolicies = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ];
  response.headers.set('Permissions-Policy', permissionsPolicies.join(', '));

  // 6. X-DNS-Prefetch-Control - 控制 DNS 预取
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // 7. Strict-Transport-Security (HSTS) - 强制 HTTPS
  // 注意：仅在生产环境的 HTTPS 上启用
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // 8. X-XSS-Protection - 旧浏览器 XSS 保护（现代浏览器已弃用，但保留以兼容）
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// 配置中间件应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 文件夹中的资源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
