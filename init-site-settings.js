// 初始化网站设置
import { createClient } from '@sanity/client'
import fs from 'fs'

// 读取环境变量
const envLocal = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envLocal.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, value] = line.split('=')
    envVars[key.trim()] = value.trim()
  }
})

const client = createClient({
  projectId: envVars.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: envVars.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: envVars.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-05-03',
})

async function initSiteSettings() {
  try {
    console.log('🔍 检查网站设置...')

    // 检查是否已存在网站设置
    const existing = await client.fetch(`*[_type == "siteSettings"][0]`)

    if (existing) {
      console.log('✅ 网站设置已存在:')
      console.log(`   标题: ${existing.title}`)
      console.log(`   首页大标题: ${existing.heroTitle}`)
      console.log('\n你可以在 BOSS-ADMIN 页面修改这些设置')
      return
    }

    console.log('📝 创建初始网站设置...')

    // 创建初始设置
    const newSettings = {
      _type: 'siteSettings',
      title: 'USEIT库',
      heroTitle: '欢迎来到我的博客',
      heroSubtitle: '分享技术、生活与思考',
      footerDescription: '一个专注于分享优质内容的个人博客',
      email: 'your-email@example.com',
      github: 'https://github.com/yourusername',
      twitter: 'https://twitter.com/yourusername',
      copyrightText: '© 2025 USEIT库. All rights reserved.',
    }

    const result = await client.create(newSettings)
    console.log('✅ 网站设置创建成功！')
    console.log(`   文档ID: ${result._id}`)
    console.log('\n现在你可以在 BOSS-ADMIN 页面修改这些设置了')

  } catch (error) {
    console.error('❌ 操作失败:', error)
  }
}

initSiteSettings()
