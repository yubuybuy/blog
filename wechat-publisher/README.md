# 微信公众号自动发布工具使用指南

## 📖 功能介绍

这个工具可以将你的 Sanity 博客文章自动同步发布到微信公众号,实现从博客到公众号的一键发布。

### 核心功能

- ✅ 自动获取 Sanity 博客最新文章
- ✅ 智能转换文章格式(支持Markdown)
- ✅ 自动上传封面图片
- ✅ 添加导流内容,引导用户访问网站
- ✅ 支持草稿模式和自动发布模式
- ✅ 批量发布,可设置发布间隔
- ✅ 发布日志记录和报告生成

## 🚀 快速开始

### 1. 获取微信公众号 AppID 和 AppSecret

#### 步骤:

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **开发 → 基本配置**
3. 找到 **开发者ID(AppID)** 和 **开发者密码(AppSecret)**
4. 如果是第一次使用,需要先重置 AppSecret

⚠️ **注意**: 只有**认证的服务号或订阅号**才能使用高级接口发布文章

### 2. 配置环境变量

在项目根目录的 `.env.local` 文件中添��以下配置:

```env
# 微信公众号配置
WECHAT_APP_ID=你的AppID
WECHAT_APP_SECRET=你的AppSecret

# 网站URL(用于导流)
NEXT_PUBLIC_BASE_URL=https://www.sswl.top

# Sanity配置(应该已经存在)
NEXT_PUBLIC_SANITY_PROJECT_ID=你的项目ID
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=你的API令牌
```

### 3. 安装依赖

如果需要额外的依赖,运行:

```bash
npm install dotenv
```

### 4. 运行发布工具

#### 仅创建草稿(推荐首次使用)

```bash
node wechat-publisher/sync-to-wechat.js
```

这将创建1篇草稿,你可以在公众号后台查看并手动发布。

#### 自动发布1篇文章

```bash
node wechat-publisher/sync-to-wechat.js --auto-publish
```

#### 批量发布多篇文章

```bash
# 自动发布3篇文章
node wechat-publisher/sync-to-wechat.js --auto-publish --limit=3

# 仅创建5篇草稿
node wechat-publisher/sync-to-wechat.js --limit=5
```

## 📋 命令行选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--auto-publish` | 自动发布(不加则仅创建草稿) | false |
| `--limit=N` | 发布数量限制 | 1 |
| `--help` | 显示帮助信息 | - |

## 🎯 工作流程

### 文���发布流程

```
Sanity博客文章
    ↓
获取最新文章
    ↓
转换格式 + 添加导流内容
    ↓
上传封面图片
    ↓
创建草稿
    ↓
[可选] 自动发布
    ↓
记录发布日志
```

### 导流策略

工具会自动在文章中添加:

1. **资源获取引导**: 提示用户点击"阅读原文"获取网盘链接
2. **网站链接**: 在文章底部显示网站地址
3. **免责声明**: 自动添加版权免责声明

示例效果:

```
━━━━━━━━━━━━━━━━━━━━━
📦 如何获取资源?

本文涉及的所有网盘资源链接,
请访问我们的网站获取完整信息

👉 点击【阅读原文】即可查看所有资源链接 👈
━━━━━━━━━━━━━━━━━━━━━

⭐ 更多优质资源,请访问我们的网站
www.sswl.top

💡 资源持续更新,建议收藏本站
```

## 📊 发布日志

所有发布记录会保存在 `wechat-publisher/publish-log.json` 文件中,包含:

- 文章标题和slug
- 发布状态(draft/published/failed)
- media_id 或 msg_id
- 发布时间
- 错误信息(如果失败)

## ⚠️ 注意事项

### 1. API调用限制

微信公众号API有以下限制:

- **access_token**: 有效期2小时,每日获取次数有限(2000次)
- **群发消息**:
  - 认证订阅号: 每天1条
  - 认证服务号: 每月4条(可申请增加)
- **模板消息**: 根据粉丝数量有不同限制

⚠️ **建议**: 首次使用时先用 `--limit=1` 测试,不要一次性发布太多

### 2. 图片要求

- 格式: JPG/PNG
- 大小: 不超过2MB
- 尺寸: 建议900px × 500px以上

### 3. 内容审核

微信公众号对内容有严格审核:

- 避免版权敏感词汇
- 不要包含违规链接
- 确保内容合法合规

工具已经按照 `AI_CONTENT_RULES.md` 的规则进行内容优化。

### 4. 首次使用建议

1. 先用草稿模式测试: `node wechat-publisher/sync-to-wechat.js`
2. 在公众号后台查看草稿效果
3. 确认无误后再使用 `--auto-publish` 自动发布

## 🔧 高级配置

### 自定义发布间隔

编辑 `sync-to-wechat.js` 中的 `interval` 参数:

```javascript
const results = await publisher.batchPublish(articles.slice(0, limit), {
  autoPublish,
  interval: 120000, // 改为2分钟间隔
  limit
});
```

### 修改导流文案

编辑 `article-converter.js` 中的 `buildResourceSection` 和 `buildFooter` 方法。

### 添加Sanity字段追踪

为了避免重复发布,建议在 Sanity schema 中添加字段:

```javascript
// sanity/schemas/post.ts
{
  name: 'wechatPublished',
  title: '已发布到公众号',
  type: 'boolean',
  initialValue: false
},
{
  name: 'wechatMediaId',
  title: '公众号Media ID',
  type: 'string'
},
{
  name: 'wechatPublishedAt',
  title: '公众号发布时间',
  type: 'datetime'
}
```

## 🛠️ 故障排除

### 问题1: access_token 获取失败

**错误**: `获取access_token失败: invalid appid`

**解决**:
- 检查 AppID 和 AppSecret 是否正确
- 确认是从正确的公众号复制的凭据
- 检查是否有多余的空格

### 问题2: 上传图片失败

**错误**: `上传图片失败: image format error`

**解决**:
- 确保图片格式为 JPG/PNG
- 检查图片大小不超过2MB
- 确认图片URL可访问

### 问题3: 创建草稿失败

**错误**: `创建草稿失败: invalid media_id`

**解决**:
- 检查封面图片是否上传成功
- 确认文章内容符合公众号规范
- 检查标题长度不超过64字符

### 问题4: 群发失败

**错误**: `api unauthorized hint`

**解决**:
- 确认公众号已认证
- 检查是否超出每日群发次数限制
- 确认 AppSecret 未过期

## 📞 技术支持

遇到问题可以:

1. 查看 `wechat-publisher/publish-log.json` 日志文件
2. 查看[微信公众平台开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
3. 检查公众号后台的错误提示

## 🎉 最佳实践

1. **定时发布**: 配合 cron 或 GitHub Actions 实现定时自动发布
2. **内容审核**: 发布前先用草稿模式检查内容
3. **数据追踪**: 在 Sanity 中记录发布状态,避免重复
4. **分批发布**: 不要一次性发布太多,建议每次1-3篇
5. **测试环境**: 可以先在测试公众号上测试功能

## 📅 自动化发布(可选)

### 使用 GitHub Actions

创建 `.github/workflows/publish-wechat.yml`:

```yaml
name: Publish to WeChat

on:
  schedule:
    - cron: '0 10 * * *' # 每天上午10点
  workflow_dispatch: # 手动触发

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node wechat-publisher/sync-to-wechat.js --limit=1
        env:
          WECHAT_APP_ID: ${{ secrets.WECHAT_APP_ID }}
          WECHAT_APP_SECRET: ${{ secrets.WECHAT_APP_SECRET }}
          NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_API_TOKEN: ${{ secrets.SANITY_API_TOKEN }}
```

记得在 GitHub 仓库设置中添加 Secrets。

---

🚀 开始使用微信公众号自动发布工具,让你的内容触达更多用户!
