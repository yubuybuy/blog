/**
 * 资源推荐API接口
 */

import { NextResponse } from 'next/server';
import { getDailyRecommendation, getStats } from '@/lib/recommendation-engine';

export async function GET(request: Request) {
  try {
    // 获取查询参数中的 mode (用于循环展示不同推荐)
    const { searchParams } = new URL(request.url);
    const mode = parseInt(searchParams.get('mode') || '0');

    const [recommendation, stats] = await Promise.all([
      getDailyRecommendation(mode),
      getStats()
    ]);

    return NextResponse.json({
      success: true,
      recommendation,
      stats
    });
  } catch (error) {
    console.error('生成推荐失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成推荐失败',
        recommendation: null,
        stats: null
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
