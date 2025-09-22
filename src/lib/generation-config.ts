// AI生成参数配置详解

export interface GenerationConfig {
  // 内容质量标准
  contentStandards: {
    titleLength: { min: 10, max: 30 };           // 标题字数
    excerptLength: { min: 50, max: 100 };        // 摘要字数
    contentLength: { min: 300, max: 500 };       // 正文字数
    tagsCount: { min: 3, max: 8 };               // 标签数量
  };

  // AI模型参数（优化后）
  modelParams: {
    gemini: {
      temperature: 0.8;        // 提高创意度，生成更丰富内容
      maxTokens: 1500;         // 增加输出长度，支持更详细内容
      topP: 0.9;               // 提高多样性，避免重复表达
      topK: 40;                // 控制词汇选择范围
    };
    cohere: {
      temperature: 0.75;       // 略微提高创意度
      maxTokens: 800;          // 增加输出长度
      model: 'command';
      presencePenalty: 0.1;    // 减少重复内容
      frequencyPenalty: 0.1;   // 增加词汇多样性
    };
  };

  // 内容过滤规则
  contentFilters: {
    bannedWords: string[];     // 禁用词汇
    requiredElements: string[]; // 必需元素
    complianceChecks: string[]; // 合规检查
  };
}

// 当前使用的生成配置
export const CURRENT_CONFIG: GenerationConfig = {
  contentStandards: {
    titleLength: { min: 10, max: 30 },
    excerptLength: { min: 50, max: 100 },
    contentLength: { min: 300, max: 500 },
    tagsCount: { min: 3, max: 8 }
  },

  modelParams: {
    gemini: {
      temperature: 0.8,  // 提高创意度，生成更丰富内容
      maxTokens: 1500,   // 增加输出长度，支持更详细内容
      topP: 0.9,         // 提高多样性，避免重复表达
      topK: 40           // 控制词汇选择范围
    },
    cohere: {
      temperature: 0.75, // 略微提高创意度
      maxTokens: 800,    // 增加输出长度
      model: 'command',
      presencePenalty: 0.1,  // 减少重复内容
      frequencyPenalty: 0.1  // 增加词汇多样性
    }
  },

  contentFilters: {
    bannedWords: [
      // 避免版权敏感词
      '盗版', '破解', '免费下载',
      // 避免具体作品名
      '电影名称', '软件名称'
    ],

    requiredElements: [
      '免责声明',        // 必须包含法律声明
      '使用说明',        // 必须有使用指导
      '资源特色'         // 必须突出特点
    ],

    complianceChecks: [
      '避免侵权表述',
      '强调学习交流',
      '支持正版内容'
    ]
  }
};

// 提示词模板库
export const PROMPT_TEMPLATES = {
  // 真实博客模板（新增 - 更自然的个人博客风格）
  realistic: `
你是一个资深的博客作者，有多年的分享经验。现在要为一个资源写一篇真实的个人博客文章。

资源信息：
- 名称：{title}
- 分类：{category}
- 标签：{tags}
- 描述：{description}
- 网盘链接：{downloadLink}

写作要求：
1. **自然的标题**：
   - 避免"合集"、"资源"等明显词汇
   - 用个人化的表达，如"我最近发现了..."、"终于找到了..."、"强烈推荐..."
   - 突出个人感受和价值

2. **真实的博客语调**：
   - 用第一人称"我"写作
   - 分享个人体验和感受
   - 包含一些个人观点和建议
   - 语言自然流畅，像和朋友聊天

3. **内容结构**：
   - 开头：个人发现或体验的契机
   - 中间：详细介绍和个人感受
   - 结尾：总结和建议

4. **图片插入**：
   - 在适当位置添加 ![图片描述](IMAGE_PLACEHOLDER)
   - 图片描述要具体且相关

5. **网盘链接**：
   - 在文章最后自然地提供下载链接
   - 用友好的语调引导下载

6. **避免AI痕迹**：
   - 不要使用"嘿朋友们"等套话开头
   - 避免过于正式的表达
   - 加入一些个人化的细节

请按JSON格式返回：
{
  "title": "自然的个人博客标题",
  "excerpt": "50-80字的个人化摘要",
  "content": "500-800字的真实博客风格markdown正文",
  "tags": ["相关标签"],
  "imagePrompt": "文章配图的详细描述"
}`,

  // 接地气博客模板
  casual: `
你是一位经验丰富的个人博客创作专家，擅长将复杂的信息转化为生动有趣、贴近生活的文字。

Role: 个人博客创作专家
Background: 用户希望借助网盘资源信息，以接地气的口吻创作一篇博客文章
Profile: 你对各种话题都有深入的理解，能够用接地气的语言吸引读者，让博客文章既有深度又不失趣味
Skills: 你具备强大的文字表达能力，能够精准把握读者的心理，将专业内容与日常生活紧密结合，擅长运用幽默、风趣的语言风格

资源信息：
- 分类：{category}
- 标签：{tags}
- 描述：{description}

写作要求：
1. 用"嘿，朋友们！"或类似亲切的开场白
2. 语言轻松活泼，多用"你知道吗？"、"说不定你会发现"等互动式表达
3. 举具体的生活例子，让读者容易理解和产生共鸣
4. 保持幽默风趣，但不失专业性
5. 内容要贴近读者生活，有亲和力和可读性
6. 必须包含合规声明：仅供学习交流，支持正版

请按JSON格式返回：
{
  "title": "接地气的标题（避免具体作品名）",
  "excerpt": "50-80字的亲切摘要",
  "content": "300-500字的接地气markdown正文",
  "tags": ["3-6个相关标签"],
  "imagePrompt": "配图描述"
}`,

  // 基础模板
  basic: `
请为以下网盘资源生成博客文章，要求规避版权风险：

资源信息：
- 分类：{category}
- 标签：{tags}
- 描述：{description}

要求：
1. 标题通用化，避免具体作品名称
2. 重点强调资源特性和使用价值
3. 包含免责声明
4. 内容300-500字

请按JSON格式返回：
{
  "title": "文章标题",
  "excerpt": "文章摘要",
  "content": "文章正文(markdown格式)",
  "tags": ["标签1", "标签2"],
  "imagePrompt": "配图提示词"
}`,

  // 增强模板（更详细的指导）
  enhanced: `
你是一个专业的内容创作者，请为网盘资源创建博客文章。

背景：
- 这是一个合法的资源分享博客
- 需要规避版权风险
- 重点在于教育和信息分享

资源信息：
- 分类：{category}
- 标签：{tags}
- 描述：{description}

内容要求：
1. 标题设计：
   - 使用通用描述，如"精选{category}资源"
   - 避免具体作品名称
   - 突出价值和质量

2. 内容结构：
   - 开头：简介资源类型和特点
   - 中间：详述使用价值和适用场景
   - 结尾：使用建议和免责声明

3. 写作风格：
   - 专业、客观、实用
   - 避免过度营销语言
   - 强调教育和学习目的

4. 合规要求：
   - 必须包含"仅供学习交流"
   - 必须包含"支持正版"
   - 必须包含免责声明

输出格式（严格JSON）：
{
  "title": "20字以内的标题",
  "excerpt": "50-80字的摘要",
  "content": "300-500字的markdown正文",
  "tags": ["3-6个相关标签"],
  "imagePrompt": "配图描述"
}`,

  // 安全模板（最保守）
  safe: `
创建一篇关于{category}资源的信息性文章。

要求：
- 完全避免版权敏感内容
- 重点介绍资源类型和使用建议
- 包含完整的法律免责声明
- 语言专业、客观

返回JSON格式的文章内容。`
};

// 后处理规则
export const POST_PROCESSING_RULES = {
  // 内容检查
  contentChecks: [
    {
      rule: 'checkTitleLength',
      condition: (title: string) => title.length >= 10 && title.length <= 30,
      action: 'regenerate_title'
    },
    {
      rule: 'checkCopyright',
      condition: (content: string) => !content.includes('具体作品名'),
      action: 'flag_content'
    },
    {
      rule: 'checkDisclaimer',
      condition: (content: string) => content.includes('免责') || content.includes('声明'),
      action: 'add_disclaimer'
    }
  ],

  // 自动优化
  autoOptimizations: [
    'addSEOTags',        // 自动添加SEO标签
    'formatMarkdown',    // 格式化markdown
    'addEmojis',         // 适当添加emoji
    'checkReadability'   // 检查可读性
  ]
};

export default {
  CURRENT_CONFIG,
  PROMPT_TEMPLATES,
  POST_PROCESSING_RULES
};