/**
 * 智能资源推荐引擎
 * 根据多个维度分析，每日推荐应该收集的资源类型
 */

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// 分类轮换表（周一到周日）
const ROTATION_MAP: { [key: number]: string } = {
  1: '电影',      // 周一
  2: '软件',      // 周二
  3: '教程',      // 周三
  4: '书籍',      // 周四
  5: '游戏',      // 周五
  6: '综合',      // 周六 - 补缺
  0: '高优先级'   // 周日 - 补缺
};

// 季节性推荐（月份 -> 推荐类型）
const SEASONAL_MAP: { [key: number]: { category: string; reason: string; keywords: string[] } } = {
  1: { category: '电影', reason: '新年档期，贺岁片上映', keywords: ['新年电影', '贺岁片', '春节档'] },
  2: { category: '生活实用', reason: '春节返乡季', keywords: ['春节', '年货', '旅行攻略'] },
  3: { category: '职场技能', reason: '春季求职高峰', keywords: ['简历模板', '面试技巧', '职业规划'] },
  4: { category: '教育', reason: '考试准备季', keywords: ['考试资料', '学习方法', '复习笔记'] },
  5: { category: '职场技能', reason: '毕业季求职', keywords: ['求职', '应届生', 'offer'] },
  6: { category: '教育', reason: '高考结束，填报志愿', keywords: ['志愿填报', '大学专业', '生涯规划'] },
  7: { category: '电影', reason: '暑期档大片', keywords: ['暑期电影', '动画电影', '家庭片'] },
  8: { category: '生活实用', reason: '暑假旅游季', keywords: ['旅游攻略', '景点推荐', '旅行指南'] },
  9: { category: '教育', reason: '开学季', keywords: ['学习资料', '新学期', '教材'] },
  10: { category: '软件', reason: '双十一前置期', keywords: ['效率工具', '办公软件', '生产力'] },
  11: { category: '个人成长', reason: '年终总结季', keywords: ['时间管理', '年度计划', '自我提升'] },
  12: { category: '教育', reason: '考研冲刺期', keywords: ['考研', '复习资料', '真题'] }
};

interface CategoryStats {
  title: string;
  slug: string;
  count: number;
  lastUpdate: string | null;
  daysSinceUpdate: number;
}

interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  reasons: string[];
  suggestions: string[];
  keywords: string[];
  sources: string[];
  urgency: 'urgent' | 'normal' | 'low';
  secondaryRecommendation?: {
    category: string;
    reason: string;
  };
}

/**
 * 获取各分类的统计信息
 */
async function getCategoryStats(): Promise<CategoryStats[]> {
  try {
    const categories = await client.fetch(`
      *[_type == "category"]{
        title,
        "slug": slug.current,
        "count": count(*[_type == "post" && references(^._id)]),
        "lastUpdate": *[_type == "post" && references(^._id)] | order(publishedAt desc)[0].publishedAt
      }
    `);

    return categories.map((cat: any) => {
      const lastUpdate = cat.lastUpdate ? new Date(cat.lastUpdate) : null;
      const daysSinceUpdate = lastUpdate
        ? Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      return {
        title: cat.title,
        slug: cat.slug,
        count: cat.count || 0,
        lastUpdate: cat.lastUpdate,
        daysSinceUpdate
      };
    });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    return [];
  }
}

/**
 * 分析内容缺口
 */
function analyzeContentGap(stats: CategoryStats[]) {
  // 找出文章数量最少的分类
  const emptiest = stats
    .filter(s => s.count < 10) // 少于10篇认为不足
    .sort((a, b) => a.count - b.count);

  // 找出最久未更新的分类
  const outdated = stats
    .filter(s => s.daysSinceUpdate > 7) // 超过7天未更新
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  return { emptiest, outdated };
}

/**
 * 获取季节性推荐
 */
function getSeasonalRecommendation() {
  const month = new Date().getMonth() + 1; // 1-12
  return SEASONAL_MAP[month];
}

/**
 * 获取轮换推荐
 */
function getRotationRecommendation() {
  const dayOfWeek = new Date().getDay(); // 0-6 (周日-周六)
  return ROTATION_MAP[dayOfWeek];
}

/**
 * 生成资源收集建议
 */
function generateSuggestions(category: string): string[] {
  const suggestionMap: { [key: string]: string[] } = {
    '电影': [
      '近期上映的热门电影',
      '豆瓣高分经典电影',
      '获奖电影合集',
      '特定类型专题（科幻、悬疑、动作等）'
    ],
    '电视剧': [
      '热播电视剧',
      '经典剧集合集',
      '美剧、日剧、韩剧推荐',
      '综艺节目资源'
    ],
    '软件': [
      'Office办公插件',
      '设计工具软件',
      '效率提升工具',
      '开发环境配置'
    ],
    '教育': [
      '在线课程资源',
      '考试复习资料',
      '专业学习教程',
      '技能提升课程'
    ],
    '书籍': [
      '畅销书推荐',
      '经典名著合集',
      '专业技术书籍',
      '电子书资源包'
    ],
    '游戏': [
      '热门手游资源',
      'PC游戏推荐',
      '游戏攻略合集',
      '游戏辅助工具'
    ],
    '音乐': [
      '热门歌曲合集',
      '无损音乐专辑',
      '特定风格音乐',
      '音乐制作工具'
    ],
    '编程开发': [
      'Python入门教程',
      'Web开发全栈课程',
      '算法与数据结构',
      '项目源码合集'
    ],
    '设计素材': [
      'PPT模板合集',
      '免费商用字体',
      'UI设计素材',
      '图标icon资源'
    ],
    '办公工具': [
      'Excel技巧教程',
      '时间管理工具',
      '项目管理模板',
      '办公自动化脚本'
    ],
    '生活实用': [
      '美食菜谱大全',
      '健身教程视频',
      '旅行攻略指南',
      '生活小妙招'
    ],
    '职场技能': [
      '简历模板精选',
      '面试技巧宝典',
      '职场沟通课程',
      '职业规划指南'
    ],
    '个人成长': [
      '时间管理方法',
      '理财投资入门',
      '自我提升书籍',
      '心理学课程'
    ]
  };

  return suggestionMap[category] || [
    '优质热门资源',
    '用户需求大的内容',
    '经典必备资源',
    '最新更新资源'
  ];
}

/**
 * 生成资源来源建议
 */
function generateSources(category: string): string[] {
  const sourceMap: { [key: string]: string[] } = {
    '电影': ['电影资源吧', '影视分享QQ频道', '豆瓣电影小组', '影视资源网站'],
    '软件': ['软件分享吧', '工具软件QQ频道', 'GitHub开源项目', '软件下载站'],
    '教育': ['学习资料吧', '考研论坛', '在线课程平台', '教育资源群'],
    '游戏': ['游戏资源吧', 'TapTap论坛', 'Steam社区', '游戏分享频道'],
    '书籍': ['读书吧', '电子书分享群', '豆瓣读书', '图书资源站']
  };

  return sourceMap[category] || [
    '贴吧相关主题吧',
    'QQ频道资源分享',
    '同类型网站',
    '资源论坛社区'
  ];
}

/**
 * 生成每日推荐
 */
export async function getDailyRecommendation(): Promise<Recommendation> {
  // 1. 获取分类统计
  const stats = await getCategoryStats();

  // 2. 分析内容缺口
  const { emptiest, outdated } = analyzeContentGap(stats);

  // 3. 获取季节性推荐
  const seasonal = getSeasonalRecommendation();

  // 4. 获取轮换推荐
  const rotation = getRotationRecommendation();

  // 5. 综合决策推荐哪个分类
  let recommendedCategory: string;
  let priority: 'high' | 'medium' | 'low' = 'medium';
  let urgency: 'urgent' | 'normal' | 'low' = 'normal';
  const reasons: string[] = [];

  // 优先级：严重空缺 > 季节性 > 长期未更新 > 轮换
  if (emptiest.length > 0 && emptiest[0].count === 0) {
    // 完全空白的分类，最高优先级
    recommendedCategory = emptiest[0].title;
    priority = 'high';
    urgency = 'urgent';
    reasons.push(`❗ 该分类目前没有任何文章（严重空白）`);
  } else if (emptiest.length > 0 && emptiest[0].count < 3) {
    // 文章很少的分类
    recommendedCategory = emptiest[0].title;
    priority = 'high';
    reasons.push(`⚠️ 该分类仅有${emptiest[0].count}篇文章（严重不足）`);
  } else if (seasonal && emptiest.some(e => e.title === seasonal.category)) {
    // 季节性推荐且该分类也缺内容
    recommendedCategory = seasonal.category;
    priority = 'high';
    reasons.push(`📅 ${seasonal.reason}（时效性强）`);
    reasons.push(`⚠️ 该分类文章较少`);
  } else if (outdated.length > 0 && outdated[0].daysSinceUpdate > 14) {
    // 超过2周未更新
    recommendedCategory = outdated[0].title;
    priority = 'medium';
    reasons.push(`⏰ 已连续${outdated[0].daysSinceUpdate}天未更新`);
  } else if (seasonal) {
    // 季节性推荐
    recommendedCategory = seasonal.category;
    priority = 'medium';
    reasons.push(`📅 ${seasonal.reason}`);
  } else {
    // 按轮换推荐
    recommendedCategory = rotation;
    priority = 'low';
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
    reasons.push(`📆 今天是${weekDay}，轮换推荐该分类`);
  }

  // 添加该分类的当前状态
  const categoryInfo = stats.find(s => s.title === recommendedCategory);
  if (categoryInfo) {
    if (categoryInfo.count > 0) {
      reasons.push(`📊 该分类当前有${categoryInfo.count}篇文章`);
    }
    if (categoryInfo.daysSinceUpdate < 999) {
      reasons.push(`🕐 最近更新: ${categoryInfo.daysSinceUpdate}天前`);
    }
  }

  // 次要推荐
  let secondaryRecommendation;
  if (seasonal && seasonal.category !== recommendedCategory) {
    secondaryRecommendation = {
      category: seasonal.category,
      reason: seasonal.reason
    };
  }

  return {
    category: recommendedCategory,
    priority,
    reasons,
    suggestions: generateSuggestions(recommendedCategory),
    keywords: seasonal?.keywords || [],
    sources: generateSources(recommendedCategory),
    urgency,
    secondaryRecommendation
  };
}

/**
 * 获取统计数据
 */
export async function getStats() {
  const stats = await getCategoryStats();
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const empty = stats.filter(s => s.count === 0).length;
  const low = stats.filter(s => s.count > 0 && s.count < 5).length;

  return {
    totalArticles: total,
    totalCategories: stats.length,
    emptyCategories: empty,
    lowCategories: low,
    categories: stats
  };
}
