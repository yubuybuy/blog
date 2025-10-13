// 检查数据库中的文章总数
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

async function checkDatabase() {
  try {
    console.log('📊 检查数据库状态...')

    // 查询所有文章
    const allPosts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] {
        _id,
        title,
        publishedAt,
        markdownContent
      }
    `)

    console.log(`数据库中共有 ${allPosts.length} 篇文章`)

    if (allPosts.length > 0) {
      console.log('\n最近的文章:')
      allPosts.slice(0, 5).forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`)
        if (post.markdownContent) {
          const preview = post.markdownContent.slice(0, 100).replace(/\n/g, ' ')
          console.log(`   内容预览: ${preview}...`)
        }
      })
    } else {
      console.log('数据库中暂无文章')
    }

  } catch (error) {
    console.error('❌ 检查数据库时出现错误:', error)
  }
}

checkDatabase()