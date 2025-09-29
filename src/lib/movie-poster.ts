// 电影海报获取系统
// 文件路径: src/lib/movie-poster.ts

interface MovieSearchResult {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
}

interface TMDBResponse {
  results: MovieSearchResult[];
  total_results: number;
}

// 电影名称标准化处理 - 改进版
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
  // 匹配各种年份格式
  const yearMatch = title.match(/\.?(\d{4})(?:\D|$)/);
  return yearMatch ? yearMatch[1] : null;
}

// 从TMDB获取电影海报 - 增强版调试
export async function getMoviePoster(movieTitle: string): Promise<string | null> {
  const apiKey = process.env.TMDB_API_KEY;

  console.log('=== TMDB API 调试信息 ===');
  console.log('API Key存在:', !!apiKey);
  console.log('API Key前10位:', apiKey ? apiKey.substring(0, 10) + '...' : '未设置');
  console.log('原始电影标题:', movieTitle);

  if (!apiKey) {
    console.error('❌ TMDB API Key未配置');
    return null;
  }

  try {
    const normalizedTitle = normalizeMovieName(movieTitle);
    console.log('标准化后标题:', normalizedTitle);

    // 首先尝试中文搜索
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(normalizedTitle)}&language=zh-CN`;
    console.log('TMDB 请求URL:', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    console.log('🔍 发起TMDB API请求...');
    const response = await fetch(searchUrl);

    console.log('TMDB 响应状态:', response.status);
    console.log('TMDB 响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ TMDB API 请求失败:', response.status, errorText);
      return null;
    }

    const data: TMDBResponse = await response.json();
    console.log('TMDB 搜索结果数量:', data.results.length);

    if (data.results.length > 0) {
      console.log('所有搜索结果:');
      data.results.forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title} (${movie.original_title}) - ${movie.release_date}`);
      });

      // 改进选择逻辑：优先选择最匹配的电影
      let bestMatch = data.results[0];

      // 寻找标题完全匹配的电影
      const exactMatch = data.results.find(movie =>
        movie.title.toLowerCase() === normalizedTitle.toLowerCase() ||
        movie.original_title.toLowerCase() === normalizedTitle.toLowerCase()
      );

      if (exactMatch) {
        bestMatch = exactMatch;
        console.log('🎯 找到完全匹配的电影:', bestMatch.title);
      } else {
        // 如果没有完全匹配，选择第一个结果但记录这是部分匹配
        console.log('📝 使用部分匹配的电影:', bestMatch.title);
      }

      console.log('最终选择的电影:', {
        title: bestMatch.title,
        original_title: bestMatch.original_title,
        release_date: bestMatch.release_date,
        poster_path: bestMatch.poster_path
      });

      if (bestMatch.poster_path) {
        // 使用更高清的w780尺寸，更适合显示
        const posterUrl = `https://image.tmdb.org/t/p/w780${bestMatch.poster_path}`;
        console.log('✅ 成功获取电影海报:', posterUrl);
        return posterUrl;
      } else {
        console.log('⚠️ 选中电影没有海报');
      }
    } else {
      console.log('⚠️ 未找到匹配的电影');

      // 如果中文搜索无结果，尝试英文搜索
      console.log('🔄 尝试英文搜索...');
      const enSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(normalizedTitle)}&language=en-US`;
      const enResponse = await fetch(enSearchUrl);

      if (enResponse.ok) {
        const enData: TMDBResponse = await enResponse.json();
        console.log('英文搜索结果数量:', enData.results.length);

        if (enData.results.length > 0 && enData.results[0].poster_path) {
          // 英文搜索也使用高清w780
          const posterUrl = `https://image.tmdb.org/t/p/w780${enData.results[0].poster_path}`;
          console.log('✅ 英文搜索成功获取海报:', posterUrl);
          return posterUrl;
        }
      }
    }

    console.log('❌ 最终未找到电影海报');
    return null;
  } catch (error) {
    console.error('❌ TMDB API调用异常:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    return null;
  }
}

// 备用海报源 - 使用可靠图片服务
export function getFallbackPoster(movieTitle: string): string {
  // 使用基于标题的稳定随机数，确保同一部电影总是显示相同图片
  const hash = Math.abs(hashCode(movieTitle)) % 1000;

  // 使用picsum.photos作为备用，提供稳定的图片
  return `https://picsum.photos/400/600?random=${hash}`;
}

// 检测是否为电影类内容
export function isMovieContent(title: string, category: string, tags: string[]): boolean {
  const movieKeywords = ['电影', '影片', '电视剧', '纪录片', '动画', '剧集'];
  const movieCategories = ['电影', '影视', '娱乐', '剧集', '动画'];

  // 检查标题
  const hasMovieInTitle = movieKeywords.some(keyword => title.includes(keyword));

  // 检查分类
  const hasMovieCategory = movieCategories.some(cat => category.includes(cat));

  // 检查标签
  const hasMovieTags = tags.some(tag => movieKeywords.some(keyword => tag.includes(keyword)));

  return hasMovieInTitle || hasMovieCategory || hasMovieTags;
}

// 主要的图片生成函数 - 仅使用TMDB
export async function generateContentImage(
  title: string,
  category: string,
  tags: string[] = [],
  imagePrompt: string = ''
): Promise<string | null> {

  console.log('=== 图片生成开始 ===');
  console.log('标题:', title);
  console.log('分类:', category);
  console.log('标签:', tags);

  // 检查是否为电影内容
  if (isMovieContent(title, category, tags)) {
    console.log('✅ 检测到电影内容，尝试获取TMDB海报...');

    const poster = await getMoviePoster(title);
    if (poster) {
      console.log('🎬 成功获取TMDB海报:', poster);
      return poster;
    } else {
      console.log('❌ TMDB海报获取失败');
      return null;
    }
  } else {
    console.log('ℹ️ 非电影内容，跳过TMDB');
    return null;
  }
}

// 通用内容图片生成 - 使用可靠图片源
function getGenericImage(category: string, imagePrompt: string): string {
  // 使用分类主题的稳定图片
  const categoryMap: { [key: string]: number } = {
    '软件': 100,
    '游戏': 200,
    '音乐': 300,
    '学习': 400,
    '资源': 500,
    '工具': 600,
    '电影': 700,
    '影视': 800
  };

  const baseId = categoryMap[category] || 900;
  const stableId = baseId + Math.abs(hashCode(imagePrompt)) % 50;

  // 使用picsum.photos提供稳定的图片
  return `https://picsum.photos/800/400?random=${stableId}`;
}

// 简单的字符串哈希函数
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash;
}