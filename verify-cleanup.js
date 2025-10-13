// 验证清理效果
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

async function verifyCleanup() {
  try {
    console.log('🔍 验证清理效果...')

    // 查询第一篇文章验证
    const post = await client.fetch(`
      *[_type == "post" && !defined(deleted)] | order(publishedAt desc) [0] {
        _id,
        title,
        markdownContent
      }
    `)

    console.log(`\n📄 验证文章: ${post.title}`)
    console.log(`📊 内容长度: ${post.markdownContent ? post.markdownContent.length : 0} 字符`)

    if (post.markdownContent) {
      console.log('\n📝 清理后的内容预览:')
      console.log('─'.repeat(50))
      console.log(post.markdownContent.slice(0, 500))
      if (post.markdownContent.length > 500) {
        console.log('\n...(内容已截断)')
      }
      console.log('─'.repeat(50))

      // 检查是否还有SEO内容
      const seoPatterns = [
        'SEO关键词引导段',
        '🔍 SEO',
        '为什么值得看？',
        '适合哪些人看？',
        '点击获取高清资源',
        '网盘资源分享',
        '✅'
      ]

      const foundSEO = []
      seoPatterns.forEach(pattern => {
        if (post.markdownContent.includes(pattern)) {
          foundSEO.push(pattern)
        }
      })

      if (foundSEO.length > 0) {
        console.log(`\n⚠️  仍然发现SEO内容: ${foundSEO.join(', ')}`)
      } else {
        console.log(`\n✅ 清理成功！文章已无SEO导向内容`)
      }
    }

  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error)
  }
}

verifyCleanup()