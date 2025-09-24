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

// 电影名称标准化处理
function normalizeMovieName(title: string): string {
  return title
    .replace(/[《》【】]/g, '') // 移除中文书名号
    .replace(/\([^)]*\)/g, '') // 移除括号内容
    .replace(/\s*-\s*.*$/, '') // 移除 - 后的内容
    .replace(/第[一二三四五六七八九十\d]+[部季]/g, '') // 移除"第X部/季"
    .trim();
}

// 从TMDB获取电影海报
export async function getMoviePoster(movieTitle: string): Promise<string | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.log('TMDB API Key未配置');
    return null;
  }

  try {
    const normalizedTitle = normalizeMovieName(movieTitle);
    console.log(`搜索电影: ${normalizedTitle}`);

    // 首先尝试中文搜索
    let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(normalizedTitle)}&language=zh-CN`;

    let response = await fetch(searchUrl);
    let data: TMDBResponse = await response.json();

    // 如果中文搜索无结果，尝试英文搜索
    if (data.results.length === 0) {
      console.log('中文搜索无结果，尝试英文搜索');
      searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(normalizedTitle)}&language=en-US`;
      response = await fetch(searchUrl);
      data = await response.json();
    }

    if (data.results.length > 0) {
      const movie = data.results[0];
      if (movie.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        console.log(`找到电影海报: ${posterUrl}`);
        return posterUrl;
      }
    }

    console.log('未找到电影海报');
    return null;
  } catch (error) {
    console.error('TMDB API调用失败:', error);
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

// 主要的图片生成函数
export async function generateContentImage(
  title: string,
  category: string,
  tags: string[] = [],
  imagePrompt: string = ''
): Promise<string> {

  // 如果是电影内容，优先获取海报
  if (isMovieContent(title, category, tags)) {
    console.log('检测到电影内容，获取海报...');

    const poster = await getMoviePoster(title);
    if (poster) {
      return poster;
    }

    // 如果获取海报失败，使用电影风格的备用图
    console.log('海报获取失败，使用备用图');
    return getFallbackPoster(title);
  }

  // 非电影内容使用通用图片
  return getGenericImage(category, imagePrompt);
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