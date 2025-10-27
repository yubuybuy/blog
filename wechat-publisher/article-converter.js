/**
 * 文章格���转换模块
 * 将博客文章转换为微信公众号图文消息格式
 */

class ArticleConverter {
  constructor(siteUrl) {
    this.siteUrl = siteUrl || 'https://www.sswl.top';
  }

  /**
   * 转换文章为公众号格式
   * @param {Object} article - 博客文章对象
   * @returns {Object} 公众号图文消息格式
   */
  convertToWeChatArticle(article) {
    const { title, excerpt, content, mainImage, slug, netdiskLinks } = article;

    // 构建完整的文章链接
    const articleUrl = `${this.siteUrl}/posts/${slug}`;

    // 转换内容格式
    const convertedContent = this.convertContent(content, netdiskLinks, articleUrl);

    return {
      title: this.optimizeTitle(title),
      author: article.author?.name || 'AI小白',
      digest: this.optimizeExcerpt(excerpt, articleUrl),
      content: convertedContent,
      content_source_url: articleUrl,
      thumb_media_id: '', // 需要先上传封面图片
      need_open_comment: 0, // 是否打开评论,默认关闭
      only_fans_can_comment: 0 // 是否粉丝才可评论
    };
  }

  /**
   * 优化标题,确保符合公众号要求
   */
  optimizeTitle(title) {
    // 公众号标题最长64个字符
    if (title.length > 64) {
      return title.substring(0, 61) + '...';
    }
    return title;
  }

  /**
   * 优化摘要
   */
  optimizeExcerpt(excerpt, articleUrl) {
    // 添加导流提示
    const trafficHint = `\n\n🔗 点击阅读原文获取网盘资源链接`;

    // 公众号摘要最长120个字符
    const maxLength = 120 - trafficHint.length;
    let optimizedExcerpt = excerpt;

    if (excerpt.length > maxLength) {
      optimizedExcerpt = excerpt.substring(0, maxLength - 3) + '...';
    }

    return optimizedExcerpt + trafficHint;
  }

  /**
   * 转换文章内容
   */
  convertContent(content, netdiskLinks, articleUrl) {
    let html = `<div style="font-size: 16px; line-height: 1.8; color: #333;">`;

    // 转换Markdown或纯文本为HTML
    html += this.markdownToHtml(content);

    // 添加资源获取引导部分
    html += this.buildResourceSection(netdiskLinks, articleUrl);

    // 添加底部导流
    html += this.buildFooter(articleUrl);

    html += `</div>`;

    return html;
  }

  /**
   * 简单的Markdown转HTML
   * (实际使用时可以用marked或其他库)
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // 标题转换
    html = html.replace(/^### (.*$)/gim, '<h3 style="color: #2c3e50; margin: 20px 0 10px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="color: #2c3e50; margin: 25px 0 15px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="color: #2c3e50; margin: 30px 0 20px;">$1</h1>');

    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 列表
    html = html.replace(/^\* (.*$)/gim, '<li style="margin: 5px 0;">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li style="margin: 5px 0;">$1</li>');

    // 段落
    html = html.split('\n\n').map(para => {
      if (para.startsWith('<h') || para.startsWith('<li')) {
        return para;
      }
      return `<p style="margin: 15px 0; text-align: justify;">${para}</p>`;
    }).join('\n');

    return html;
  }

  /**
   * 构建资源获取部分
   */
  buildResourceSection(netdiskLinks, articleUrl) {
    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 20px;
                  border-radius: 10px;
                  margin: 30px 0;
                  text-align: center;">
        <h3 style="color: white; margin-bottom: 15px;">📦 如何获取资源?</h3>
        <p style="color: #f0f0f0; font-size: 15px; line-height: 1.6;">
          本文涉及的所有网盘资源链接,<br/>
          请访问我们的网站获取完整信息
        </p>
        <div style="background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;">
          <p style="color: #667eea; font-weight: bold; font-size: 14px; margin: 0;">
            👉 点击【阅读原文】即可查看所有资源链接 👈
          </p>
        </div>
      </div>
    `;
  }

  /**
   * 构建文章底部
   */
  buildFooter(articleUrl) {
    return `
      <div style="border-top: 2px solid #e0e0e0;
                  margin-top: 40px;
                  padding-top: 20px;
                  text-align: center;">
        <p style="color: #888; font-size: 14px;">
          ⭐ 更多优质资源,请访问我们的网站
        </p>
        <p style="color: #667eea;
                  font-weight: bold;
                  font-size: 16px;
                  margin: 10px 0;">
          ${this.siteUrl}
        </p>
        <p style="color: #999; font-size: 13px; margin-top: 15px;">
          💡 资源持续更新,建议收藏本站
        </p>
      </div>

      <div style="background: #f8f9fa;
                  padding: 15px;
                  border-radius: 8px;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #666;">
        <p style="margin: 5px 0;">⚠️ 免责声明</p>
        <p style="margin: 5px 0; line-height: 1.5;">
          本站仅提供资源信息分享,不存储任何文件。所有资源均来源于网络,仅供学习交流使用。
          如有版权问题,请联系我们删除。
        </p>
      </div>
    `;
  }

  /**
   * 验证文章格式
   */
  validateArticle(article) {
    const errors = [];

    if (!article.title || article.title.trim() === '') {
      errors.push('文章标题不能为空');
    }

    if (article.title && article.title.length > 64) {
      errors.push('文章标题超过64个字符');
    }

    if (!article.content || article.content.trim() === '') {
      errors.push('文章内容不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default ArticleConverter;
