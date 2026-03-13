// 检查具体文章内容是否包含SEO内容
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

async function checkArticleContent() {
  try {
    console.log('🔍 检查文章内容中的SEO标记...')

    // 查询第一篇文章的完整内容
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] | order(publishedAt desc) [0..2] {
        _id,
        title,
        markdownContent
      }
    `)

    for (const post of posts) {
      console.log(`\n📄 检查文章: ${post.title}`)

      if (post.markdownContent) {
        const content = post.markdownContent

        // 检查各种SEO相关内容
        const seoPatterns = [
          'SEO关键词引导段',
          '🔍 SEO',
          '为什么值得看？',
          '适合哪些人看？',
          '点击获取高清资源',
          '网盘资源分享',
          '✅ 视觉效果',
          '✅ 角色情感',
          '✅ 反派魅力'
        ]

        const foundSEO = []
        seoPatterns.forEach(pattern => {
          if (content.includes(pattern)) {
            foundSEO.push(pattern)
          }
        })

        if (foundSEO.length > 0) {
          console.log(`  ⚠️  发现SEO内容: ${foundSEO.join(', ')}`)

          // 显示包含SEO内容的段落
          const lines = content.split('\n')
          lines.forEach((line, index) => {
            if (foundSEO.some(pattern => line.includes(pattern))) {
              console.log(`    第${index + 1}行: ${line}`)
            }
          })
        } else {
          console.log(`  ✅ 内容干净，无SEO标记`)
        }

        console.log(`  📊 内容长度: ${content.length} 字符`)
      } else {
        console.log(`  ℹ️  该文章没有markdownContent字段`)
      }
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error)
  }
}

checkArticleContent()