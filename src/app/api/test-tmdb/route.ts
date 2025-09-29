import { NextRequest, NextResponse } from 'next/server';
import { getMoviePoster } from '@/lib/movie-poster';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movie = searchParams.get('movie') || '阿凡达';

    console.log('=== TMDB 测试 ===');
    console.log('测试电影:', movie);
    console.log('TMDB API Key存在:', !!process.env.TMDB_API_KEY);

    const result = await getMoviePoster(movie);

    return NextResponse.json({
      movie,
      tmdbApiKey: !!process.env.TMDB_API_KEY,
      result,
      success: !!result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TMDB测试失败:', error);
    return NextResponse.json({
      error: '测试失败',
      details: error instanceof Error ? error.message : '未知错误',
      tmdbApiKey: !!process.env.TMDB_API_KEY
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { movie } = await request.json();

    if (!movie) {
      return NextResponse.json({ error: '请提供电影名称' }, { status: 400 });
    }

    console.log('=== TMDB POST 测试 ===');
    console.log('测试电影:', movie);

    const result = await getMoviePoster(movie);

    return NextResponse.json({
      movie,
      result,
      success: !!result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('TMDB POST测试失败:', error);
    return NextResponse.json({
      error: '测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}