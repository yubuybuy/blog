// OMDb API电影海报获取
// 文件路径: src/lib/omdb-poster.ts

interface OMDbResponse {
  Title: string;
  Year: string;
  Poster: string;
  Response: string;
  Error?: string;
}

// 从OMDb API获取电影海报
export async function getOMDbPoster(movieTitle: string): Promise<string | null> {
  // OMDb API的免费key，你可以从 http://www.omdbapi.com/apikey.aspx 获取
  const apiKey = process.env.OMDB_API_KEY || 'your_omdb_key_here';

  console.log('=== OMDb API 搜索 ===');
  console.log('搜索电影:', movieTitle);

  if (!apiKey || apiKey === 'your_omdb_key_here') {
    console.log('⚠️ OMDb API Key未配置');
    return null;
  }

  try {
    const year = extractYear(movieTitle);
    const cleanTitle = normalizeMovieName(movieTitle);

    const searchUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&apikey=${apiKey}${year ? `&y=${year}` : ''}`;
    console.log('OMDb 请求URL:', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`OMDb API error: ${response.status}`);
    }

    const data: OMDbResponse = await response.json();

    if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
      console.log('✅ OMDb找到海报:', data.Title, data.Year);
      console.log('海报URL:', data.Poster);
      return data.Poster;
    } else {
      console.log('❌ OMDb未找到电影或海报');
      console.log('错误信息:', data.Error);
      return null;
    }

  } catch (error) {
    console.error('❌ OMDb API调用失败:', error);
    return null;
  }
}

// 豆瓣电影搜索（如果可用）
export async function getDoubanPoster(movieTitle: string): Promise<string | null> {
  console.log('=== 豆瓣电影搜索 ===');
  console.log('搜索电影:', movieTitle);

  try {
    // 注意：豆瓣API有访问限制，这里只是示例
    // 实际使用时可能需要代理或其他方式
    const searchUrl = `https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(movieTitle)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://movie.douban.com/'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0 && data[0].img) {
        console.log('✅ 豆瓣找到海报:', data[0].title);
        return data[0].img;
      }
    }

    console.log('❌ 豆瓣未找到电影');
    return null;

  } catch (error) {
    console.error('❌ 豆瓣搜索失败:', error);
    return null;
  }
}

// 图片搜索API（百度/必应）
export async function searchMoviePoster(movieTitle: string): Promise<string | null> {
  console.log('=== 图片搜索 ===');
  console.log('搜索:', movieTitle, '海报');

  try {
    // 使用Unsplash搜索电影海报
    const query = `${movieTitle} movie poster`;
    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.log('⚠️ Unsplash Access Key未配置');
      return null;
    }

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results.length > 0) {
        const photo = data.results[0];
        console.log('✅ 找到相关图片:', photo.alt_description);
        return photo.urls.regular;
      }
    }

    console.log('❌ 未找到相关图片');
    return null;

  } catch (error) {
    console.error('❌ 图片搜索失败:', error);
    return null;
  }
}

// 辅助函数
function extractYear(title: string): string | null {
  const yearMatch = title.match(/\.?(\d{4})(?:\D|$)/);
  return yearMatch ? yearMatch[1] : null;
}

function normalizeMovieName(title: string): string {
  return title
    .replace(/[《》【】]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s*-\s*.*$/, '')
    .replace(/第[一二三四五六七八九十\d]+[部季]/g, '')
    .replace(/\.(\d{4})$/, ' $1')
    .replace(/[\.·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}