# 🔐 API 密钥更换指南

> **紧急程度**：🔴 高优先级
> **预计用时**：10-15 分钟
> **最后更新**：2026-01-19

---

## 🚨 为什么要更换？

在之前的安全审计和故障排查中，以下 API 密钥被暴露在对话记录中。虽然对话是私密的，但为了最大化安全性，强烈建议更换所有暴露的密钥。

### 已暴露的密钥清单

| 序号 | 密钥类型 | 风险等级 | 更换优先级 |
|------|---------|---------|-----------|
| 1 | Sanity CMS Token | 🔴 极高 | ⭐⭐⭐⭐⭐ 必须更换 |
| 2 | 百度 AI 密钥 | 🟠 中高 | ⭐⭐⭐⭐ 强烈建议 |
| 3 | 智谱 GLM 密钥 | 🟡 中 | ⭐⭐⭐ 建议更换 |
| 4 | Google Gemini | 🟡 中低 | ⭐⭐ 可选 |
| 5 | TMDB 密钥 | 🟢 低 | ⭐ 可选 |
| 6 | Cohere API | 🟡 中低 | ⭐⭐ 可选 |
| 7 | 百度推送 Token | 🟡 中低 | ⭐⭐ 可选 |

---

## 1️⃣ 更换 Sanity CMS Token（最重要！）

### 🔴 风险说明
- **暴露的 Token**：`sk2xg0MkVegCsZP5h029KH...`
- **危害**：他人可以删除、修改您的所有博客内容
- **必须更换**：⭐⭐⭐⭐⭐

### 📝 更换步骤

#### 步骤 1：登录 Sanity
1. 访问：https://www.sanity.io/
2. 使用您的账号登录

#### 步骤 2：进入项目设置
1. 在 Dashboard 中找到项目 `w7iihdoh`
2. 点击进入项目

#### 步骤 3：管理 API Tokens
1. 点击左侧菜单 **Settings** (齿轮图标)
2. 选择 **API** 选项卡
3. 找到 **Tokens** 部分

#### 步骤 4：删除旧 Token
1. 找到现有的 Token（可能显示为 `Editor` 或自定义名称）
2. 点击右侧的 **Delete** 或垃圾桶图标
3. 确认删除

#### 步骤 5：创建新 Token
1. 点击 **Add API Token** 按钮
2. 配置新 Token：
   - **Label**：`Production Blog API`（或任意名称）
   - **Permissions**：选择 `Editor`（允许读写）
   - **Environment**：选择 `production`
3. 点击 **Create**

#### 步骤 6：复制新 Token
⚠️ **重要**：Token 只会显示一次，立即复制保存！
```
新 Token 类似这样：
sk**************************
```

#### 步骤 7：更新 Vercel 环境变量
1. 访问：https://vercel.com/dashboard
2. 选择您的项目（netdisk-blog）
3. 进入 **Settings** → **Environment Variables**
4. 找到 `SANITY_API_TOKEN`
5. 点击右侧的 **Edit** 按钮
6. 粘贴新 Token
7. 确保选择了 **Production**、**Preview**、**Development**
8. 点击 **Save**

#### 步骤 8：更新本地环境变量
1. 打开 `.env.local` 文件
2. 找到这一行：
   ```env
   SANITY_API_TOKEN=sk2xg0MkVegCsZP5h029KH...（旧的）
   ```
3. 替换为：
   ```env
   SANITY_API_TOKEN=<刚才复制的新 Token>
   ```
4. 保存文件

#### 步骤 9：重新部署
1. 在 Vercel Dashboard → Deployments
2. 点击最新部署右侧的三个点 `...`
3. 选择 **Redeploy**
4. 等待部署完成（约 1-2 分钟）

#### 步骤 10：验证
1. 访问：https://www.sswl.top/
2. 查看首页文章是否正常加载
3. 登录后台测试发布功能

✅ **完成！Sanity Token 已安全更换**

---

## 2️⃣ 更换百度 AI 密钥

### 🟠 风险说明
- **暴露的密钥**：`BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`
- **危害**：他人可能消耗您的免费额度
- **建议更换**：⭐⭐⭐⭐

### 📝 更换步骤

#### 步骤 1：登录百度智能云
1. 访问：https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application
2. 使用百度账号登录

#### 步骤 2：找到应用
1. 在 **千帆大模型平台** → **应用列表**
2. 找到您创建的应用

#### 步骤 3：重置密钥
1. 点击应用名称进入详情
2. 找到 **API Key** 和 **Secret Key**
3. 点击 **重置** 或 **Reset** 按钮
4. 确认重置

#### 步骤 4：复制新密钥
```
API Key: 新的 API Key
Secret Key: 新的 Secret Key
```

#### 步骤 5：更新 Vercel
1. 访问 Vercel → Settings → Environment Variables
2. 更新 `BAIDU_API_KEY`
3. 更新 `BAIDU_SECRET_KEY`
4. 重新部署

#### 步骤 6：更新本地
更新 `.env.local`：
```env
BAIDU_API_KEY=<新的 API Key>
BAIDU_SECRET_KEY=<新的 Secret Key>
```

✅ **完成！百度 AI 密钥已更换**

---

## 3️⃣ 更换智谱 GLM 密钥

### 🟡 风险说明
- **暴露的密钥**：`ZHIPU_API_KEY`
- **危害**：消耗免费额度
- **建议更换**：⭐⭐⭐

### 📝 更换步骤

#### 步骤 1：登录智谱 AI
1. 访问：https://open.bigmodel.cn/
2. 登录您的账号

#### 步骤 2：管理 API Keys
1. 点击右上角头像 → **个人中心**
2. 选择 **API Keys** 选项卡

#### 步骤 3：删除旧密钥
1. 找到现有的 API Key
2. 点击 **删除** 按钮

#### 步骤 4：生成新密钥
1. 点击 **生成新的 API Key**
2. 复制新密钥

#### 步骤 5：更新配置
- Vercel: 更新 `ZHIPU_API_KEY`
- 本地: 更新 `.env.local`

✅ **完成！智谱密钥已更换**

---

## 4️⃣ 更换 Google Gemini 密钥

### 🟡 风险说明
- **暴露的密钥**：`GEMINI_API_KEY`
- **危害**：消耗配额
- **优先级**：⭐⭐ 可选

### 📝 更换步骤

#### 步骤 1：访问 Google AI Studio
1. 访问：https://aistudio.google.com/app/apikey
2. 使用 Google 账号登录

#### 步骤 2：删除旧密钥
1. 找到现有的 API Key
2. 点击 **Delete** 删除

#### 步骤 3：创建新密钥
1. 点击 **Create API key**
2. 选择 Google Cloud 项目
3. 复制新密钥

#### 步骤 4：更新配置
- Vercel: 更新 `GEMINI_API_KEY`
- 本地: 更新 `.env.local`

✅ **完成！Gemini 密钥已更换**

---

## 5️⃣ 更换 TMDB 密钥

### 🟢 风险说明
- **暴露的密钥**：`TMDB_API_KEY`
- **危害**：影响较小（免费服务）
- **优先级**：⭐ 可选

### 📝 更换步骤

#### 步骤 1：登录 TMDB
1. 访问：https://www.themoviedb.org/settings/api
2. 登录您的账号

#### 步骤 2：重置密钥
1. 在 API 页面找到 **API Key**
2. 点击 **Reset** 或重新生成
3. 复制新密钥

#### 步骤 3：更新配置
- Vercel: 更新 `TMDB_API_KEY`
- 本地: 更新 `.env.local`

✅ **完成！TMDB 密钥已更换**

---

## 📋 更换进度清单

打印此清单，完成后勾选：

- [ ] **Sanity CMS Token** 🔴 极高优先级
  - [ ] 删除旧 Token
  - [ ] 创建新 Token
  - [ ] 更新 Vercel
  - [ ] 更新本地
  - [ ] 重新部署
  - [ ] 验证功能

- [ ] **百度 AI 密钥** 🟠 高优先级
  - [ ] 重置密钥
  - [ ] 更新 Vercel
  - [ ] 更新本地

- [ ] **智谱 GLM 密钥** 🟡 中优先级
  - [ ] 删除旧密钥
  - [ ] 生成新密钥
  - [ ] 更新配置

- [ ] **Google Gemini** 🟡 可选
  - [ ] 删除旧密钥
  - [ ] 创建新密钥
  - [ ] 更新配置

- [ ] **TMDB 密钥** 🟢 可选
  - [ ] 重置密钥
  - [ ] 更新配置

---

## ⚠️ 重要提醒

### 更换后的注意事项

1. **立即测试**
   - 更换密钥后立即测试相关功能
   - 确保网站正常运行

2. **不要提交到 Git**
   - `.env.local` 已在 `.gitignore` 中
   - 永远不要将密钥提交到 Git

3. **安全保存**
   - 将新密钥保存到密码管理器
   - 不要分享给他人

4. **定期更换**
   - 建议每 3-6 个月更换一次
   - 发现异常立即更换

---

## 🆘 遇到问题？

### 常见问题

**Q1: 更换后网站无法访问怎么办？**
A: 检查 Vercel 环境变量是否正确配置，并确保重新部署了。

**Q2: 旧 Token 删除后立即失效吗？**
A: 是的，删除后旧 Token 立即无法使用。确保先配置好新 Token 再删除旧的。

**Q3: 本地开发需要重启吗？**
A: 是的，修改 `.env.local` 后需要重启开发服务器（`npm run dev`）。

---

**完成时间记录**：____年____月____日

**更换人**：________________

**验证结果**：□ 成功  □ 需要调整
