// 简化的身份验证API
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

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
      // 生成简单的会话token
      const token = Buffer.from(`ai-session:${Date.now()}`).toString('base64');

      return NextResponse.json({
        success: true,
        token: token,
        message: '验证成功'
      });
    } else {
      // 记录失败尝试
      const forwarded = request.headers.get('x-forwarded-for');
      const clientIp = forwarded?.split(',')[0] || request.ip || 'unknown';
      console.log(`❌ AI生成器登录失败 - IP: ${clientIp}`);

      return NextResponse.json({
        success: false,
        error: '密码错误'
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
    hasPassword: !!process.env.BOSS_AI_PASSWORD,
    timestamp: new Date().toISOString()
  });
}