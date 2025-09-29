import { NextRequest, NextResponse } from 'next/server';
import { getMoviePoster } from '@/lib/movie-poster';

// 电影名称标准化处理 - 复制用于测试
function normalizeMovieName(title: string): string {
  return title
    .replace(/[《》【】]/g, '') // 移除中文书名号
    .replace(/\([^)]*\)/g, '') // 移除括号内容
    .replace(/\s*-\s*.*$/, '') // 移除 - 后的内容
    .replace(/第[一二三四五六七八九十\d]+[部季]/g, '') // 移除"第X部/季"
    .replace(/\.(\d{4})$/, ' $1') // 将.2006格式转换为 2006
    .replace(/[\.·]/g, ' ') // 将点号转换为空格
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim();
}

// 提取年份信息
function extractYear(title: string): string | null {
  const yearMatch = title.match(/\.?(\d{4})(?:\D|$)/);
  return yearMatch ? yearMatch[1] : null;
}

// 直接测试TMDB API
async function testTMDBSearch(query: string, year?: string): Promise<any> {
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=zh-CN${year ? `&year=${year}` : ''}`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      query,
      year,
      url: searchUrl.replace(apiKey!, 'API_KEY_HIDDEN'),
      total_results: data.total_results,
      results: data.results.slice(0, 3).map((movie: any) => ({
        title: movie.title,
        original_title: movie.original_title,
        release_date: movie.release_date,
        poster_path: movie.poster_path
      }))
    };
  } catch (error) {
    return {
      query,
      year,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movie = searchParams.get('movie') || '谜之屋.2006';

    console.log('=== 详细TMDB测试 ===');
    console.log('原始电影名:', movie);

    const normalized = normalizeMovieName(movie);
    const year = extractYear(movie);

    console.log('标准化后:', normalized);
    console.log('提取年份:', year);

    // 进行多种搜索测试
    const tests = [
      { name: '中文搜索 (带年份)', query: normalized, year, lang: 'zh-CN' },
      { name: '中文搜索 (不带年份)', query: normalized, year: undefined, lang: 'zh-CN' },
      { name: '英文搜索 (带年份)', query: normalized, year, lang: 'en-US' },
      { name: '原始标题搜索', query: movie, year: undefined, lang: 'zh-CN' }
    ];

    const results = [];

    for (const test of tests) {
      console.log(`测试: ${test.name}`);
      const apiKey = process.env.TMDB_API_KEY;

      try {
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(test.query)}&language=${test.lang}${test.year ? `&year=${test.year}` : ''}`;

        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json();
          results.push({
            test: test.name,
            query: test.query,
            year: test.year,
            lang: test.lang,
            url: searchUrl.replace(apiKey!, 'API_KEY_HIDDEN'),
            total_results: data.total_results,
            results: data.results.slice(0, 3).map((movie: any) => ({
              title: movie.title,
              original_title: movie.original_title,
              release_date: movie.release_date,
              poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null
            }))
          });
        } else {
          results.push({
            test: test.name,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        results.push({
          test: test.name,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    // 也测试现有的getMoviePoster函数
    const posterResult = await getMoviePoster(movie);

    return NextResponse.json({
      movie,
      normalized,
      year,
      tmdbApiKey: !!process.env.TMDB_API_KEY,
      getMoviePosterResult: posterResult,
      detailedTests: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('详细TMDB测试失败:', error);
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