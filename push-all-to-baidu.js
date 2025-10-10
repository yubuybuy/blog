// 推送所有文章到百度
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

const token = envVars.BAIDU_PUSH_TOKEN
const site = envVars.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'

async function pushAllArticles() {
  try {
    console.log('🚀 开始推送所有文章到百度...')

    // 获取所有文章
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] {
        slug
      }
    `)

    console.log(`📊 找到 ${posts.length} 篇文章`)

    // 构建URL列表
    const urls = [
      `${site}/`,
      `${site}/posts`,
      `${site}/categories`,
      `${site}/search`,
      ...posts.map(post => `${site}/posts/${post.slug.current}`)
    ]

    console.log(`\n📤 准备推送 ${urls.length} 个URL到百度`)

    // 百度推送有限制，每次最多500条，我们分批推送
    const batchSize = 100
    let totalSuccess = 0
    let totalRemain = 0

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      console.log(`\n📦 推送第 ${Math.floor(i / batchSize) + 1} 批 (${batch.length} 条)...`)

      const pushUrl = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`

      const response = await fetch(pushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: batch.join('\n'),
      })

      const result = await response.json()

      if (result.success !== undefined) {
        totalSuccess += result.success
        totalRemain = result.remain
        console.log(`  ✅ 成功: ${result.success} 条`)
        console.log(`  📊 剩余配额: ${result.remain} 条`)
      } else {
        console.log(`  ⚠️  结果:`, result)
      }

      // 等待1秒避免请求过快
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`\n🎉 推送完成！`)
    console.log(`✅ 总共成功推送: ${totalSuccess} 条`)
    console.log(`📊 剩余配额: ${totalRemain} 条`)

  } catch (error) {
    console.error('❌ 推送失败:', error)
  }
}

pushAllArticles()
