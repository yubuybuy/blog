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

// Sanity 分类查询结果类型
interface SanityCategoryResult {
  title: string;
  slug: string;
  count: number;
  lastUpdate: string | null;
}

// 分类轮换表（周一到周日）
const ROTATION_MAP: { [key: number]: string } = {
  1: '电影',      // 周一
  2: '软件',      // 周二
  3: '知识分享',  // 周三
  4: '电视剧',    // 周四
  5: '电影',      // 周五
  6: '其他',      // 周六 - 补缺
  0: '高优先级'   // 周日 - 补缺
};

// 季节性推荐（月份 -> 推荐类型）
const SEASONAL_MAP: { [key: number]: { category: string; reason: string; keywords: string[] } } = {
  1: { category: '电影', reason: '新年档期，贺岁片上映', keywords: ['新年电影', '贺岁片', '春节档'] },
  2: { category: '电视剧', reason: '春节假期，剧集观看高峰', keywords: ['春节剧', '热播剧', '合家欢'] },
  3: { category: '知识分享', reason: '新学期开始，学习需求增加', keywords: ['学习资料', '开学', '新学期'] },
  4: { category: '知识分享', reason: '考试准备季', keywords: ['考试资料', '学习方法', '复习笔记'] },
  5: { category: '软件', reason: '提升效率，准备毕业季', keywords: ['办公软件', '学习工具', '效率提升'] },
  6: { category: '知识分享', reason: '期末考试，暑假计划', keywords: ['期末复习', '暑假安排', '学习计划'] },
  7: { category: '电影', reason: '暑期档大片', keywords: ['暑期电影', '动画电影', '家庭片'] },
  8: { category: '电视剧', reason: '暑假追剧季', keywords: ['暑期热剧', '经典剧集', '综艺节目'] },
  9: { category: '知识分享', reason: '开学季', keywords: ['学习资料', '新学期', '教材'] },
  10: { category: '软件', reason: '双十一前置期', keywords: ['效率工具', '办公软件', '生产力'] },
  11: { category: '电影', reason: '年终档期', keywords: ['年度佳片', '获奖电影', '经典回顾'] },
  12: { category: '知识分享', reason: '期末考试冲刺期', keywords: ['期末复习', '考试资料', '真题'] }
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

    return categories.map((cat: SanityCategoryResult) => {
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
      '学习辅助软件'
    ],
    '知识分享': [
      '小学各科学习资料',
      '同步练习题库',
      '知识点总结归纳',
      '学习方法和技巧'
    ],
    '其他': [
      '优质热门资源',
      '用户需求大的内容',
      '经典必备资源',
      '最新更新资源'
    ]
  };

  return suggestionMap[category] || suggestionMap['其他'];
}

/**
 * 生成资源来源建议
 */
function generateSources(category: string): string[] {
  const sourceMap: { [key: string]: string[] } = {
    '电影': ['电影资源吧', '影视分享QQ频道', '豆瓣电影小组', '影视资源网站'],
    '电视剧': ['电视剧吧', '影视分享QQ频道', '豆瓣剧集小组', '美剧天堂'],
    '软件': ['软件分享吧', '工具软件QQ频道', 'GitHub开源项目', '软件下载站'],
    '知识分享': ['小学学习资料吧', '家长教育群', '学习资料论坛', '教育资源网站'],
    '其他': ['贴吧相关主题吧', 'QQ频道资源分享', '同类型网站', '资源论坛社区']
  };

  return sourceMap[category] || sourceMap['其他'];
}

/**
 * 生成每日推荐
 * @param mode 推荐模式: 0=最高优先级, 1=次优先级, 2=轮换推荐
 */
export async function getDailyRecommendation(mode: number = 0): Promise<Recommendation> {
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

  // 根据 mode 选择不同的推荐策略
  const normalizedMode = mode % 3; // 循环模式: 0, 1, 2

  if (normalizedMode === 0) {
    // 模式 0: 最高优先级 - 第1个空缺分类
    if (emptiest.length > 0 && emptiest[0].count === 0) {
      recommendedCategory = emptiest[0].title;
      priority = 'high';
      urgency = 'urgent';
      reasons.push(`❗ 该分类目前没有任何文章（严重空白）`);
    } else if (emptiest.length > 0 && emptiest[0].count < 3) {
      recommendedCategory = emptiest[0].title;
      priority = 'high';
      reasons.push(`⚠️ 该分类仅有${emptiest[0].count}篇文章（严重不足）`);
    } else if (outdated.length > 0 && outdated[0].daysSinceUpdate > 14) {
      recommendedCategory = outdated[0].title;
      priority = 'medium';
      reasons.push(`⏰ 已连续${outdated[0].daysSinceUpdate}天未更新`);
    } else {
      recommendedCategory = rotation;
      priority = 'low';
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
      reasons.push(`📆 今天是${weekDay}，轮换推荐该分类`);
    }
  } else if (normalizedMode === 1) {
    // 模式 1: 推荐第2个空缺分类或季节性推荐
    if (emptiest.length > 1 && emptiest[1].count < 3) {
      recommendedCategory = emptiest[1].title;
      priority = 'high';
      reasons.push(`⚠️ 该分类仅有${emptiest[1].count}篇文章（需要充实）`);
      reasons.push(`🎯 次优先级推荐`);
    } else if (seasonal && emptiest.some(e => e.title === seasonal.category)) {
      recommendedCategory = seasonal.category;
      priority = 'high';
      reasons.push(`📅 ${seasonal.reason}（时效性强）`);
      reasons.push(`⚠️ 该分类文章较少`);
    } else if (seasonal) {
      recommendedCategory = seasonal.category;
      priority = 'medium';
      reasons.push(`📅 ${seasonal.reason}`);
    } else if (emptiest.length > 0) {
      // 如果没有第2个空缺分类，循环回到其他空缺分类
      const index = Math.min(1, emptiest.length - 1);
      recommendedCategory = emptiest[index].title;
      priority = 'medium';
      reasons.push(`📊 该分类文章数量较少（${emptiest[index].count}篇）`);
    } else {
      recommendedCategory = rotation;
      priority = 'low';
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
      reasons.push(`📆 今天是${weekDay}，轮换推荐该分类`);
    }
  } else {
    // 模式 2: 推荐第3个空缺分类或长期未更新
    if (emptiest.length > 2 && emptiest[2].count < 5) {
      recommendedCategory = emptiest[2].title;
      priority = 'medium';
      reasons.push(`📊 该分类文章数量较少（${emptiest[2].count}篇）`);
      reasons.push(`🔄 第三优先级推荐`);
    } else if (outdated.length > 0) {
      recommendedCategory = outdated[0].title;
      priority = 'medium';
      reasons.push(`⏰ 已连续${outdated[0].daysSinceUpdate}天未更新`);
      reasons.push(`🔄 建议为该分类添加新内容`);
    } else if (emptiest.length > 0) {
      // 循环到其他空缺分类
      const index = Math.min(2, emptiest.length - 1);
      recommendedCategory = emptiest[index].title;
      priority = 'medium';
      reasons.push(`📊 该分类文章数量：${emptiest[index].count}篇`);
    } else {
      recommendedCategory = rotation;
      priority = 'low';
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
      reasons.push(`📆 今天是${weekDay}，轮换推荐该分类`);
      reasons.push(`✨ 保持内容更新的好习惯`);
    }
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
