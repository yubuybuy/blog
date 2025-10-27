/**
 * 微信公众号文章发布器
 * 核心功能:上传素材、创建草稿、发布文章
 */

import WeChatAuth from './wechat-auth.js';
import ArticleConverter from './article-converter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WeChatPublisher {
  constructor(config) {
    this.config = config;
    this.auth = new WeChatAuth(config.appId, config.appSecret);
    this.converter = new ArticleConverter(config.siteUrl);
    this.logFile = path.join(__dirname, 'publish-log.json');
  }

  /**
   * 上传临时素材(图片)
   * @param {string} imagePath - 图片文件路径或URL
   * @returns {string} media_id
   */
  async uploadImage(imagePath) {
    const token = await this.auth.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${token}&type=image`;

    try {
      let imageBuffer;

      // 判断是URL还是本地文件
      if (imagePath.startsWith('http')) {
        // 从URL下载图片
        const response = await fetch(imagePath);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // 读取本地文件
        imageBuffer = fs.readFileSync(imagePath);
      }

      // 创建FormData
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('media', blob, 'image.jpg');

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.media_id) {
        console.log('图片上传成功:', result.media_id);
        return result.media_id;
      } else {
        throw new Error(`上传图片失败: ${result.errmsg || '未知错误'}`);
      }
    } catch (error) {
      console.error('上传图片出错:', error);
      throw error;
    }
  }

  /**
   * 上传永久素材(用于封面)
   * @param {string} imagePath - 图片路径或URL
   * @returns {string} media_id
   */
  async uploadPermanentImage(imagePath) {
    const token = await this.auth.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;

    try {
      let imageBuffer;

      if (imagePath.startsWith('http')) {
        const response = await fetch(imagePath);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        imageBuffer = fs.readFileSync(imagePath);
      }

      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('media', blob, 'cover.jpg');

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.media_id) {
        console.log('永久素材上传成功:', result.media_id);
        return result.media_id;
      } else {
        throw new Error(`上传永久素材失败: ${result.errmsg || '未知错误'}`);
      }
    } catch (error) {
      console.error('上传永久素材出错:', error);
      throw error;
    }
  }

  /**
   * 创建草稿
   * @param {Object} article - 文章对象
   * @returns {string} media_id
   */
  async createDraft(article) {
    const token = await this.auth.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;

    // 验证文章格式
    const validation = this.converter.validateArticle(article);
    if (!validation.valid) {
      throw new Error(`文章格式验证失败: ${validation.errors.join(', ')}`);
    }

    // 转换文章格式
    const wechatArticle = this.converter.convertToWeChatArticle(article);

    // 上传封面图
    if (article.mainImage) {
      try {
        wechatArticle.thumb_media_id = await this.uploadPermanentImage(article.mainImage);
      } catch (error) {
        console.warn('封面上传失败,使用默认封面:', error.message);
      }
    }

    // 构建草稿数据
    const draftData = {
      articles: [wechatArticle]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftData)
      });

      const result = await response.json();

      if (result.media_id) {
        console.log('草稿创建成功, media_id:', result.media_id);
        this.logPublish(article, 'draft', result.media_id);
        return result.media_id;
      } else {
        throw new Error(`创建草稿失败: ${result.errmsg || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建草稿出错:', error);
      throw error;
    }
  }

  /**
   * 发布草稿(群发)
   * @param {string} mediaId - 草稿的media_id
   * @returns {Object} 发布结果
   */
  async publishDraft(mediaId) {
    const token = await this.auth.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${token}`;

    const publishData = {
      filter: {
        is_to_all: true // 发送给所有用户
      },
      mpnews: {
        media_id: mediaId
      },
      msgtype: 'mpnews',
      send_ignore_reprint: 0 // 是否转载
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publishData)
      });

      const result = await response.json();

      if (result.errcode === 0) {
        console.log('文章发布成功, msg_id:', result.msg_id);
        this.logPublish({ mediaId }, 'published', result.msg_id);
        return result;
      } else {
        throw new Error(`发布文章失败: ${result.errmsg || '未知错误'}`);
      }
    } catch (error) {
      console.error('发布文章出错:', error);
      throw error;
    }
  }

  /**
   * 一键发布文章(创建草稿并发布)
   * @param {Object} article - 文章对象
   * @param {boolean} autoPublish - 是否自动发布,false则仅创建草稿
   * @returns {Object} 发布结果
   */
  async publish(article, autoPublish = false) {
    try {
      console.log(`\n开始处理文章: ${article.title}`);

      // 创建草稿
      const mediaId = await this.createDraft(article);

      if (autoPublish) {
        // 等待1秒后发布
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 发布草稿
        const publishResult = await this.publishDraft(mediaId);

        return {
          success: true,
          mediaId,
          msgId: publishResult.msg_id,
          message: '文章已发布到公众号'
        };
      } else {
        return {
          success: true,
          mediaId,
          message: '草稿已创建,请到公众号后台手动发布'
        };
      }
    } catch (error) {
      console.error('发布失败:', error);
      this.logPublish(article, 'failed', null, error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量发布文章
   * @param {Array} articles - 文章数组
   * @param {Object} options - 发布选项
   */
  async batchPublish(articles, options = {}) {
    const {
      autoPublish = false,
      interval = 60000, // 发布间隔,默认1分钟
      limit = 5 // 每次最多发布数量
    } = options;

    const results = [];
    const articlesToPublish = articles.slice(0, limit);

    for (let i = 0; i < articlesToPublish.length; i++) {
      const article = articlesToPublish[i];

      console.log(`\n[${i + 1}/${articlesToPublish.length}] 处理文章: ${article.title}`);

      const result = await this.publish(article, autoPublish);
      results.push({
        article: article.title,
        ...result
      });

      // 如果不是最后一篇,等待间隔时间
      if (i < articlesToPublish.length - 1) {
        console.log(`等待 ${interval / 1000} 秒后继续...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    // 生成汇总报告
    this.generateReport(results);

    return results;
  }

  /**
   * 记录发布日志
   */
  logPublish(article, status, id, error = null) {
    let logs = [];

    try {
      if (fs.existsSync(this.logFile)) {
        logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
      }
    } catch (err) {
      console.warn('读取日志文件失败:', err);
    }

    logs.push({
      title: article.title || 'Unknown',
      slug: article.slug || '',
      status,
      id,
      error,
      timestamp: new Date().toISOString()
    });

    try {
      fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
    } catch (err) {
      console.error('写入日志文件失败:', err);
    }
  }

  /**
   * 生成发布报告
   */
  generateReport(results) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log('\n' + '='.repeat(50));
    console.log('发布报告');
    console.log('='.repeat(50));
    console.log(`总计: ${results.length} 篇`);
    console.log(`成功: ${successCount} 篇`);
    console.log(`失败: ${failCount} 篇`);
    console.log('='.repeat(50));

    if (failCount > 0) {
      console.log('\n失败列表:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.article}: ${r.error}`);
      });
    }
  }
}

export default WeChatPublisher;
