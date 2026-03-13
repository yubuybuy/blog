// 检查文章是否还有网盘链接数据
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

async function checkNetdiskLinks() {
  try {
    console.log('🔍 检查文章的网盘链接数据...\n')

    // 查询所有文章，包括可能存储网盘链接的字段
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] | order(publishedAt desc) {
        _id,
        title,
        downloadLink,
        netdiskUrl,
        resourceUrl,
        markdownContent
      }
    `)

    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`)

      // 检查各种可能的网盘链接字段
      if (post.downloadLink) {
        console.log(`   📁 downloadLink: ${post.downloadLink}`)
      }
      if (post.netdiskUrl) {
        console.log(`   📁 netdiskUrl: ${post.netdiskUrl}`)
      }
      if (post.resourceUrl) {
        console.log(`   📁 resourceUrl: ${post.resourceUrl}`)
      }

      // 检查内容中是否有网盘链接残留
      if (post.markdownContent) {
        const quarkMatch = post.markdownContent.match(/https?:\/\/pan\.quark\.cn\/s\/[a-zA-Z0-9]+/)
        if (quarkMatch) {
          console.log(`   📁 内容中的链接: ${quarkMatch[0]}`)
        }
      }

      console.log('')
    })

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error)
  }
}

checkNetdiskLinks()