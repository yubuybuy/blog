// 详细检查每篇文章的完整内容
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

async function checkDetailedContent() {
  try {
    console.log('🔍 详细检查文章内容...\n')

    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] | order(publishedAt desc) {
        _id,
        title,
        markdownContent
      }
    `)

    for (const post of posts) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📄 ${post.title}`)
      console.log(`ID: ${post._id}`)
      console.log(`${'='.repeat(60)}`)

      if (post.markdownContent) {
        // 显示完整内容
        console.log(post.markdownContent)
        console.log('\n')

        // 检查是否有链接
        const hasLink = /https?:\/\/pan\.quark\.cn\/s\//.test(post.markdownContent)
        if (hasLink) {
          console.log('✅ 包含网盘链接')
        } else {
          console.log('❌ 缺少网盘链接')
        }
      } else {
        console.log('⚠️  没有内容')
      }
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error)
  }
}

checkDetailedContent()