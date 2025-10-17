# 博客维护笔记

## 最近的重要修复 (2025-10-17)

### 1. SEO内容清理
- **问题**: 文章中包含 `🔍 SEO关键词引导段` 等SEO导向内容
- **解决**:
  - 修改了 `src/lib/generation-config.ts` 模板
  - 清理了所有现有文章的SEO标记
  - 创建了清理脚本 `clean-seo-content.js`

### 2. 网盘链接恢复
- **问题**: 清理SEO内容时误删了网盘链接
- **解决**:
  - 创建了 `netdisk-links-to-restore.txt` 收集链接
  - 使用 `restore-links-auto.js` 批量恢复
  - 成功恢复11篇文章的网盘链接

### 3. 百度推送配置
- **问题**: 百度站长显示推送数据为0
- **原因**: Vercel 未配置 Cron Jobs
- **解决**:
  - 在 `vercel.json` 中添加了定时任务配置
  - 每天UTC 2:00 (北京时间 10:00) 自动推送
  - 测试确认API工作正常

### 需要的环境变量 (Vercel)
```
BAIDU_PUSH_TOKEN=VJga6MCp0CjWCLw9
CRON_SECRET=(需要生成一个随机字符串)
```

## 重要脚本

### 清理SEO内容
```bash
node clean-seo-content.js
```

### 恢复网盘链接
```bash
node restore-links-auto.js
```

### 测试百度推送
```bash
node test-baidu-push.js
```

### 检查文章内容
```bash
node check-netdisk-links.js
node check-seo-detailed.js
```

## 部署流程

1. 本地修改代码
2. 构建测试: `npm run build`
3. 提交: `git add . && git commit -m "消息"`
4. 推送: `git push`
5. Vercel 自动部署
6. 检查部署状态: https://vercel.com/dashboard

## 文件结构

- `/src/lib/generation-config.ts` - AI生成文章的模板配置
- `/src/app/api/cron/baidu-push/route.ts` - 百度推送定时任务
- `/vercel.json` - Vercel配置（包括Cron Jobs）
- `/.env.local` - 本地环境变量
- `/resources.json` - 资源数据源

## 下次对话快速恢复提示

如果使用 `/resume` 命令恢复对话，请参考本文件快速了解：
- 最近完成的修复和配置
- 重要脚本的使用方法
- 项目结构和关键文件位置

---
最后更新: 2025-10-17
Claude Code 会话总结
