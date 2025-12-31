/**
 * 资源推荐API接口
 */

import { NextResponse } from 'next/server';
import { getDailyRecommendation, getStats } from '@/lib/recommendation-engine';

export async function GET() {
  try {
    const [recommendation, stats] = await Promise.all([
      getDailyRecommendation(),
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
