/**
 * 微信公众号认证和Token管理模块
 * 负责获取access_token并自动刷新
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WeChatAuth {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.tokenFile = path.join(__dirname, '.wechat-token.json');
    this.accessToken = null;
    this.expiresAt = null;
  }

  /**
   * 获取access_token
   * 如果本地token未过期则直接返回,否则重新获取
   */
  async getAccessToken() {
    // 检查本地缓存的token
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      console.log('使用缓存的access_token');
      return this.accessToken;
    }

    // 尝试从文件读取
    const tokenFromFile = this.loadTokenFromFile();
    if (tokenFromFile && tokenFromFile.expiresAt > Date.now()) {
      console.log('使用文件缓存的access_token');
      this.accessToken = tokenFromFile.accessToken;
      this.expiresAt = tokenFromFile.expiresAt;
      return this.accessToken;
    }

    // 重新获取token
    return await this.refreshAccessToken();
  }

  /**
   * 从微信服务器获取新的access_token
   */
  async refreshAccessToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        // token有效期为7200秒,提前5分钟过期
        this.expiresAt = Date.now() + (data.expires_in - 300) * 1000;

        // 保存到文件
        this.saveTokenToFile();

        console.log('成功获取新的access_token');
        return this.accessToken;
      } else {
        throw new Error(`获取access_token失败: ${data.errmsg || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取access_token出错:', error);
      throw error;
    }
  }

  /**
   * 保存token到文件
   */
  saveTokenToFile() {
    const tokenData = {
      accessToken: this.accessToken,
      expiresAt: this.expiresAt,
      updatedAt: new Date().toISOString()
    };

    try {
      fs.writeFileSync(this.tokenFile, JSON.stringify(tokenData, null, 2));
      console.log('Token已保存到文件');
    } catch (error) {
      console.error('保存token失败:', error);
    }
  }

  /**
   * 从文件加载token
   */
  loadTokenFromFile() {
    try {
      if (fs.existsSync(this.tokenFile)) {
        const data = fs.readFileSync(this.tokenFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('读取token文件失败:', error);
    }
    return null;
  }

  /**
   * 清除本地token缓存
   */
  clearToken() {
    this.accessToken = null;
    this.expiresAt = null;

    try {
      if (fs.existsSync(this.tokenFile)) {
        fs.unlinkSync(this.tokenFile);
        console.log('Token缓存已清除');
      }
    } catch (error) {
      console.error('清除token缓存失败:', error);
    }
  }
}

export default WeChatAuth;
