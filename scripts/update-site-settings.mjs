// 更新 Sanity CMS 网站设置
// 用法: node scripts/update-site-settings.mjs
import { createClient } from '@sanity/client'
import fs from 'fs'

// 读取 .env.local
let envVars = {}
try {
  const envLocal = fs.readFileSync('.env.local', 'utf8')
  envLocal.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const idx = line.indexOf('=')
      envVars[line.substring(0, idx).trim()] = line.substring(idx + 1).trim()
    }
  })
} catch {
  console.error('找不到 .env.local，请确保文件存在且包含 Sanity 凭据')
  process.exit(1)
}

const client = createClient({
  projectId: envVars.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: envVars.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: envVars.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
})

const newSettings = {
  title: '觅库',
  heroTitle: '发现好资源，从这里开始',
  heroSubtitle: '精选电影、软件、游戏等网盘资源，持续更新中',
  footerDescription: '觅库 — 精选网盘资源推荐与分享',
  copyrightText: '觅库 - 发现好资源',
}

async function update() {
  try {
    const existing = await client.fetch(`*[_type == "siteSettings"][0]`)
    if (!existing) {
      console.log('未找到 siteSettings 文档，正在创建...')
      const result = await client.create({ _type: 'siteSettings', ...newSettings })
      console.log('创建成功:', result._id)
      return
    }

    console.log('当前设置:')
    console.log(`  title: ${existing.title}`)
    console.log(`  heroTitle: ${existing.heroTitle}`)
    console.log(`  heroSubtitle: ${existing.heroSubtitle}`)
    console.log('')

    const result = await client.patch(existing._id).set(newSettings).commit()
    console.log('更新成功!')
    console.log(`  title: ${result.title}`)
    console.log(`  heroTitle: ${result.heroTitle}`)
    console.log(`  heroSubtitle: ${result.heroSubtitle}`)
  } catch (err) {
    console.error('更新失败:', err.message)
  }
}

update()
