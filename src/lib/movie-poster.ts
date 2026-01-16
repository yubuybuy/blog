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
    const year = extractYear(movieTitle);
    console.log('标准化后标题:', normalizedTitle);
    console.log('提取的年份:', year);

    // 首先尝试中文搜索，如果有年份就加上年份参数
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(normalizedTitle)}&language=zh-CN${year ? `&year=${year}` : ''}`;
    console.log('TMDB 请求URL:', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    console.log('🔍 发起TMDB API请求...');
    const response = await fetch(searchUrl);

    console.log('TMDB 响应状态:', response.status);

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

      // 如果有年份，优先选择年份匹配的电影
      if (year) {
        const yearMatch = data.results.find(movie =>
          movie.release_date && movie.release_date.startsWith(year)
        );
        if (yearMatch) {
          bestMatch = yearMatch;
          console.log('🎯 找到年份匹配的电影:', bestMatch.title, bestMatch.release_date);
        } else {
          console.log('⚠️ 未找到年份匹配，使用第一个结果');
        }
      }

      // 如果没有年份信息，寻找标题完全匹配的电影
      if (!year) {
        const exactMatch = data.results.find(movie =>
          movie.title.toLowerCase() === normalizedTitle.toLowerCase() ||
          movie.original_title.toLowerCase() === normalizedTitle.toLowerCase()
        );

        if (exactMatch) {
          bestMatch = exactMatch;
          console.log('🎯 找到完全匹配的电影:', bestMatch.title);
        } else {
          console.log('📝 使用部分匹配的电影:', bestMatch.title);
        }
      }

      console.log('最终选择的电影:', {
        title: bestMatch.title,
        original_title: bestMatch.original_title,
        release_date: bestMatch.release_date,
        poster_path: bestMatch.poster_path
      });

      if (bestMatch.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w780${bestMatch.poster_path}`;
        console.log('✅ 成功获取电影海报:', posterUrl);
        return posterUrl;
      } else {
        console.log('⚠️ 选中电影没有海报');
      }
    } else {
      console.log('⚠️ 中文搜索未找到匹配的电影');

      // 如果中文搜索无结果，尝试英文搜索
      console.log('🔄 尝试英文搜索...');
      const enSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(normalizedTitle)}&language=en-US${year ? `&year=${year}` : ''}`;
      const enResponse = await fetch(enSearchUrl);

      if (enResponse.ok) {
        const enData: TMDBResponse = await enResponse.json();
        console.log('英文搜索结果数量:', enData.results.length);

        if (enData.results.length > 0) {
          let bestEnMatch = enData.results[0];

          // 英文搜索也应用年份匹配
          if (year) {
            const yearMatch = enData.results.find(movie =>
              movie.release_date && movie.release_date.startsWith(year)
            );
            if (yearMatch) {
              bestEnMatch = yearMatch;
              console.log('🎯 英文搜索找到年份匹配:', bestEnMatch.title, bestEnMatch.release_date);
            }
          }

          if (bestEnMatch.poster_path) {
            const posterUrl = `https://image.tmdb.org/t/p/w780${bestEnMatch.poster_path}`;
            console.log('✅ 英文搜索成功获取海报:', posterUrl);
            return posterUrl;
          }
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

import { getOMDbPoster, getDoubanPoster, searchMoviePoster } from './omdb-poster';

// 主要的图片生成函数 - 多源海报获取
export async function generateContentImage(
  title: string,
  category: string,
  tags: string[] = [],
  _imagePrompt: string = '' // 保留用于未来 AI 图片生成功能
): Promise<string | null> {

  console.log('=== 图片生成开始 ===');
  console.log('标题:', title);
  console.log('分类:', category);
  console.log('标签:', tags);

  // 检查是否为电影内容
  if (isMovieContent(title, category, tags)) {
    console.log('✅ 检测到电影内容，尝试多源获取海报...');

    // 多源海报获取策略
    const poster = await getMoviePosterMultiSource(title);
    if (poster) {
      console.log('🎬 成功获取电影海报:', poster);
      return poster;
    } else {
      console.log('❌ 所有海报源都失败');
      return null;
    }
  } else {
    console.log('ℹ️ 非电影内容，跳过海报获取');
    return null;
  }
}

// 多源电影海报获取
async function getMoviePosterMultiSource(movieTitle: string): Promise<string | null> {
  console.log('=== 多源海报获取 ===');
  console.log('电影标题:', movieTitle);

  const sources = [
    { name: 'TMDB', fn: () => getMoviePosterEnhanced(movieTitle) },
    { name: 'OMDb', fn: () => getOMDbPoster(movieTitle) },
    { name: '豆瓣', fn: () => getDoubanPoster(movieTitle) },
    { name: '图片搜索', fn: () => searchMoviePoster(movieTitle) }
  ];

  // 依次尝试每个源
  for (const source of sources) {
    try {
      console.log(`🔍 尝试 ${source.name}...`);
      const result = await source.fn();

      if (result) {
        console.log(`✅ ${source.name} 成功获取海报:`, result);
        return result;
      } else {
        console.log(`❌ ${source.name} 未找到海报`);
      }
    } catch (error) {
      console.error(`❌ ${source.name} 出错:`, error);
    }
  }

  console.log('❌ 所有海报源都失败');
  return null;
}

// 增强版电影海报获取 - 多种搜索策略
export async function getMoviePosterEnhanced(movieTitle: string): Promise<string | null> {
  console.log('=== 增强版TMDB搜索 ===');
  console.log('原始标题:', movieTitle);

  // 生成多种可能的搜索词
  const searchVariants = generateSearchVariants(movieTitle);
  console.log('生成的搜索变体:', searchVariants);

  // 依次尝试每种搜索策略
  for (const variant of searchVariants) {
    console.log(`🔍 尝试搜索: "${variant.query}" (策略: ${variant.strategy})`);

    const result = await searchTMDBMovie(variant.query, variant.year);
    if (result) {
      console.log(`✅ 找到海报 (策略: ${variant.strategy}):`, result);
      return result;
    }
  }

  console.log('❌ 所有搜索策略都失败');
  return null;
}

// 生成搜索变体
function generateSearchVariants(title: string): Array<{query: string, year?: string, strategy: string}> {
  const variants = [];
  const year = extractYear(title) || undefined; // 将 null 转换为 undefined

  // 1. 标准化处理
  const normalized = normalizeMovieName(title);
  variants.push({ query: normalized, year, strategy: '标准化+年份' });
  variants.push({ query: normalized, strategy: '标准化' });

  // 2. 原始标题
  const originalWithoutYear = title.replace(/\.?\d{4}/, '').trim();
  variants.push({ query: originalWithoutYear, year, strategy: '原始+年份' });

  // 3. 常见的电影名称映射
  const mappings = getMovieNameMappings(title);
  mappings.forEach(mapping => {
    variants.push({ query: mapping, year, strategy: '名称映射+年份' });
    variants.push({ query: mapping, strategy: '名称映射' });
  });

  // 4. 英文搜索（如果包含中文）
  if (/[\u4e00-\u9fff]/.test(title)) {
    const englishVariants = getEnglishVariants(title);
    englishVariants.forEach(english => {
      variants.push({ query: english, year, strategy: '英文翻译+年份' });
      variants.push({ query: english, strategy: '英文翻译' });
    });
  }

  // 去重
  const unique = variants.filter((variant, index, self) =>
    index === self.findIndex(v => v.query === variant.query && v.year === variant.year)
  );

  return unique;
}

// 常见电影名称映射
function getMovieNameMappings(title: string): string[] {
  const mappings: { [key: string]: string[] } = {
    '谜之屋': ['Monster House', '怪兽屋', '鬼屋', 'House'],
    '魔戒': ['Lord of the Rings', 'LOTR'],
    '指环王': ['Lord of the Rings', 'LOTR'],
    '哈利波特': ['Harry Potter'],
    '变形金刚': ['Transformers'],
    '复仇者联盟': ['Avengers'],
    '钢铁侠': ['Iron Man'],
    '蜘蛛侠': ['Spider-Man', 'Spiderman'],
    '蝙蝠侠': ['Batman'],
    '超人': ['Superman'],
    '泰坦尼克号': ['Titanic'],
    '阿凡达': ['Avatar'],
    '星球大战': ['Star Wars'],
    '侏罗纪公园': ['Jurassic Park'],
    '终结者': ['Terminator'],
    '黑客帝国': ['Matrix', 'The Matrix']
  };

  for (const [chinese, variants] of Object.entries(mappings)) {
    if (title.includes(chinese)) {
      return variants;
    }
  }

  return [];
}

// 英文变体
function getEnglishVariants(title: string): string[] {
  // 这里可以添加更多的中英文对照
  const commonTranslations: { [key: string]: string[] } = {
    '谜之屋': ['Monster House', 'Mystery House', 'Haunted House'],
    '恐怖': ['Horror', 'Terror'],
    '鬼': ['Ghost', 'Spirit'],
    '屋': ['House', 'Home'],
    '房子': ['House', 'Home']
  };

  const variants = [];
  for (const [chinese, english] of Object.entries(commonTranslations)) {
    if (title.includes(chinese)) {
      variants.push(...english);
    }
  }

  return variants;
}

// 搜索TMDB电影
async function searchTMDBMovie(query: string, year?: string): Promise<string | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    // 尝试中文搜索
    let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=zh-CN${year ? `&year=${year}` : ''}`;

    let response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.results.length > 0) {
        const movie = selectBestMatch(data.results, query, year);
        if (movie?.poster_path) {
          return `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
        }
      }
    }

    // 如果中文搜索失败，尝试英文搜索
    searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US${year ? `&year=${year}` : ''}`;

    response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.results.length > 0) {
        const movie = selectBestMatch(data.results, query, year);
        if (movie?.poster_path) {
          return `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('TMDB搜索失败:', error);
    return null;
  }
}

// 选择最佳匹配的电影
function selectBestMatch(results: MovieSearchResult[], query: string, year?: string): MovieSearchResult | null {
  if (!results.length) return null;

  // 如果有年份，优先选择年份匹配的
  if (year) {
    const yearMatch = results.find(movie =>
      movie.release_date && movie.release_date.startsWith(year)
    );
    if (yearMatch) return yearMatch;
  }

  // 选择标题最匹配的
  const exactMatch = results.find(movie =>
    movie.title.toLowerCase() === query.toLowerCase() ||
    movie.original_title.toLowerCase() === query.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // 返回第一个结果
  return results[0];
}

// 通用内容图片生成 - 使用可靠图片源（暂未使用，保留用于未来功能）
// function getGenericImage(category: string, imagePrompt: string): string {
//   // 使用分类主题的稳定图片
//   const categoryMap: { [key: string]: number } = {
//     '软件': 100,
//     '游戏': 200,
//     '音乐': 300,
//     '学习': 400,
//     '资源': 500,
//     '工具': 600,
//     '电影': 700,
//     '影视': 800
//   };
//
//   const baseId = categoryMap[category] || 900;
//   const stableId = baseId + Math.abs(hashCode(imagePrompt)) % 50;
//
//   // 使用picsum.photos提供稳定的图片
//   return `https://picsum.photos/800/400?random=${stableId}`;
// }


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