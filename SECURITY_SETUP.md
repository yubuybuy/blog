# 🔒 安全修复配置指南

## ✅ 已完成的安全改进

### 1. 安全认证系统
- ✅ 使用 bcrypt 哈希密码（SALT_ROUNDS=12）
- ✅ 实施 JWT Token 认证（24小时过期）
- ✅ 防暴力破解速率限制（5次尝试/5分钟，锁定15分钟）
- ✅ 前端显示剩余尝试次数

### 2. 新增文件
- `src/lib/auth.ts` - 安全认证工具库
- `scripts/generate-password-hash.js` - 密码哈希生成工具
- `.env.example` - 环境变量模板（已更新）

### 3. 修改的文件
- `src/app/api/ai-auth/route.ts` - 安全认证API
- `src/app/boss-admin/page.tsx` - 改进的登录界面

---

## 📝 配置步骤（重要！）

### 步骤 1: 生成安全密码哈希

运行密码哈希生成工具：

```bash
node scripts/generate-password-hash.js
```

按提示操作：
1. 输入新密码（建议至少12位，包含大小写字母、数字、特殊字符）
2. 确认密码
3. 复制生成的 `BOSS_PASSWORD_HASH` 和 `JWT_SECRET`

**密码强度建议：**
```
✓ 至少 12 位字符
✓ 包含大写字母 (A-Z)
✓ 包含小写字母 (a-z)
✓ 包含数字 (0-9)
✓ 包含特殊字符 (!@#$%^&*)

示例: MySecure@Pass2026!
```

---

### 步骤 2: 更新 .env.local 文件

打开 `.env.local` 文件，添加/更新以下内容：

```env
# 1. 添加密码哈希（从步骤1复制）
BOSS_PASSWORD_HASH=$2b$12$xxx...（你生成的哈希）

# 2. 添加 JWT 密钥（从步骤1复制）
JWT_SECRET=你生成的64位随机字符串

# 3. 保留旧密码（临时兼容）
BOSS_AI_PASSWORD=Hsta3879

# 4. 其他配置保持不变
BOSS_USERNAME=gao-huan
NEXT_PUBLIC_SANITY_PROJECT_ID=w7iihdoh
# ... 其他配置
```

---

### 步骤 3: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)

# 重新启动
npm run dev
```

---

### 步骤 4: 测试新的认证系统

1. 访问 `http://localhost:3000/boss-admin`
2. 使用你的新密码登录
3. 验证功能：
   - ✅ 正确密码可以登录
   - ✅ 错误密码显示剩余尝试次数
   - ✅ 5次失败后被锁定15分钟
   - ✅ Token 24小时后自动过期

---

## 🔑 API 密钥更换指南

### 为什么要更换？
你的 API 密钥已在本次安全审计中暴露，需要立即更换以防止滥用。

### 需要更换的密钥：

#### 1. Sanity CMS Token
- **位置**: [sanity.io](https://www.sanity.io/)
- **步骤**:
  1. 登录 Sanity.io
  2. 进入项目 `w7iihdoh`
  3. Settings → API → Tokens
  4. 删除旧 Token，创建新 Token
  5. 更新 `.env.local` 中的 `SANITY_API_TOKEN`

#### 2. 百度 AI 密钥
- **位置**: [千帆大模型平台](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
- **步骤**:
  1. 登录百度智能云
  2. 千帆大模型平台 → 应用列表
  3. 重置或创建新的 API Key
  4. 更新 `.env.local` 中的 `BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`

#### 3. 智谱 GLM 密钥
- **位置**: [智谱AI开放平台](https://open.bigmodel.cn/)
- **步骤**:
  1. 登录智谱AI
  2. 个人中心 → API Keys
  3. 删除旧密钥，生成新密钥
  4. 更新 `.env.local` 中的 `ZHIPU_API_KEY`

#### 4. Google Gemini 密钥
- **位置**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **步骤**:
  1. 登录 Google AI Studio
  2. Get API Key → Delete old key
  3. Create new API key
  4. 更新 `.env.local` 中的 `GEMINI_API_KEY`

#### 5. TMDB 密钥
- **位置**: [The Movie Database](https://www.themoviedb.org/settings/api)
- **步骤**:
  1. 登录 TMDB
  2. Settings → API → Reset key
  3. 更新 `.env.local` 中的 `TMDB_API_KEY`

#### 6. 百度推送 Token
- **位置**: [百度搜索资源平台](https://ziyuan.baidu.com/)
- **步骤**:
  1. 登录百度搜索资源平台
  2. 网站管理 → 你的网站 → 资源提交
  3. 查看新的推送 Token
  4. 更新 `.env.local` 中的 `BAIDU_PUSH_TOKEN`

---

## 🚀 生产环境部署清单

### Vercel 环境变量配置

如果你使用 Vercel 部署，需要在 Vercel 控制台添加环境变量：

1. 进入 [Vercel Dashboard](https://vercel.com/)
2. 选择你的项目
3. Settings → Environment Variables
4. 添加以下变量（从 `.env.local` 复制）：

```
必需变量：
- BOSS_USERNAME
- BOSS_PASSWORD_HASH
- JWT_SECRET
- NEXT_PUBLIC_SANITY_PROJECT_ID
- NEXT_PUBLIC_SANITY_DATASET
- SANITY_API_TOKEN
- NEXT_PUBLIC_BASE_URL

可选变量（根据你使用的服务）：
- BAIDU_API_KEY
- BAIDU_SECRET_KEY
- ZHIPU_API_KEY
- GEMINI_API_KEY
- TMDB_API_KEY
- BAIDU_PUSH_TOKEN
```

5. 重新部署项目

---

## 🔒 安全最佳实践

### DO（推荐做法）✅
- ✅ 使用强密码（至少12位）
- ✅ 定期更换密码（3-6个月）
- ✅ 永不将 `.env.local` 提交到 Git
- ✅ 不同服务使用不同密码
- ✅ 启用双因素认证（如果服务支持）
- ✅ 定期检查 API 使用情况

### DON'T（禁止做法）❌
- ❌ 不要在代码中硬编码密码
- ❌ 不要分享 API 密钥给他人
- ❌ 不要在公共场所展示包含密钥的屏幕
- ❌ 不要将密钥发送到聊天工具
- ❌ 不要使用简单密码（如 123456、password）

---

## 🐛 故障排除

### 问题 1: 登录失败，提示"服务器配置错误"
**原因**: 没有配置 `BOSS_PASSWORD_HASH`
**解决**: 运行 `node scripts/generate-password-hash.js` 并更新 `.env.local`

### 问题 2: Token 无效或已过期
**原因**: JWT_SECRET 未配置或 Token 超过24小时
**解决**: 重新登录获取新 Token

### 问题 3: 被锁定无法登录
**原因**: 5次登录失败触发速率限制
**解决**: 等待15分钟后重试，或重启开发服务器清除内存记录

### 问题 4: bcrypt 安装失败
**原因**: 缺少编译工具
**解决**:
- Windows: 安装 `npm install -g windows-build-tools`
- Mac: 安装 Xcode Command Line Tools
- Linux: 安装 `build-essential`

---

## 📊 安全改进对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| 密码存储 | ❌ 明文 | ✅ bcrypt 哈希 |
| Token 安全性 | ❌ 可预测 | ✅ JWT 签名 |
| 防暴力破解 | ❌ 无保护 | ✅ 速率限制 |
| Token 过期 | ❌ 永不过期 | ✅ 24小时 |
| 失败反馈 | ❌ 无提示 | ✅ 显示剩余次数 |

---

## ✅ 验证清单

完成配置后，请逐项检查：

- [ ] 已运行 `node scripts/generate-password-hash.js`
- [ ] 已添加 `BOSS_PASSWORD_HASH` 到 `.env.local`
- [ ] 已添加 `JWT_SECRET` 到 `.env.local`
- [ ] 已重启开发服务器
- [ ] 可以使用新密码登录
- [ ] 错误密码显示剩余尝试次数
- [ ] 5次失败后被锁定
- [ ] 已更换所有 API 密钥
- [ ] 已在 Vercel 添加环境变量（如果部署）
- [ ] `.env.local` 已被 `.gitignore` 排除

---

## 📞 需要帮助？

如果遇到问题：
1. 检查控制台日志 (F12 → Console)
2. 检查服务器日志
3. 确认 `.env.local` 配置正确
4. 确认所有依赖已安装 (`npm install`)

---

**文档版本**: 1.0
**最后更新**: 2026-01-14
**相关文件**:
- `src/lib/auth.ts`
- `src/app/api/ai-auth/route.ts`
- `scripts/generate-password-hash.js`
- `.env.example`
