// 服务器端身份验证API
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 从服务器端环境变量读取凭证
    const correctUsername = process.env.BOSS_USERNAME;
    const correctPassword = process.env.BOSS_PASSWORD;

    if (!correctUsername || !correctPassword) {
      console.error('❌ 服务器配置错误：缺少BOSS账号配置');
      return NextResponse.json({
        success: false,
        error: '服务器配置错误'
      }, { status: 500 });
    }

    if (username === correctUsername && password === correctPassword) {
      // 成功验证 - 返回临时token
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      return NextResponse.json({
        success: true,
        token: token,
        message: '验证成功'
      });
    } else {
      console.log(`❌ 登录失败尝试: ${username} from ${request.ip}`);
      return NextResponse.json({
        success: false,
        error: '账号或密码错误'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('验证API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 });
  }
}