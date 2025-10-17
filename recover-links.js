// 从文档历史中提取并恢复网盘链接
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

// 提取网盘链接
function extractNetdiskLink(content) {
  if (!content) return null
  const match = content.match(/https?:\/\/pan\.quark\.cn\/s\/[a-zA-Z0-9]+/)
  return match ? match[0] : null
}

async function recoverNetdiskLinks() {
  try {
    console.log('🔄 从历史版本恢复网盘链接...\n')

    // 查询所有文章
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] | order(_updatedAt desc) {
        _id,
        title,
        markdownContent,
        _updatedAt
      }
    `)

    let recovered = 0
    let failed = 0

    for (const post of posts) {
      const hasLink = extractNetdiskLink(post.markdownContent)

      if (hasLink) {
        console.log(`✅ ${post.title} - 已有链接: ${hasLink}`)
        continue
      }

      console.log(`\n🔍 ${post.title} - 尝试恢复链接...`)

      try {
        // 查询文档的所有历史版本（包括草稿）
        const history = await client.fetch(`
          *[_id match "${post._id}*"] | order(_updatedAt desc) {
            _id,
            _updatedAt,
            markdownContent
          }
        `)

        console.log(`   找到 ${history.length} 个历史版本`)

        // 在历史版本中查找网盘链接
        let foundLink = null
        for (const version of history) {
          const link = extractNetdiskLink(version.markdownContent)
          if (link) {
            foundLink = link
            console.log(`   📁 在历史版本中找到链接: ${link}`)
            break
          }
        }

        if (foundLink) {
          // 恢复链接到文章末尾
          const updatedContent = post.markdownContent + `\n\n**📁 资源获取**\n[获取观看资源](${foundLink})\n`

          await client
            .patch(post._id)
            .set({ markdownContent: updatedContent })
            .commit()

          console.log(`   ✅ 已恢复链接到文章`)
          recovered++
        } else {
          console.log(`   ❌ 未能在历史版本中找到链接`)
          failed++
        }

      } catch (error) {
        console.log(`   ❌ 恢复失败: ${error.message}`)
        failed++
      }
    }

    console.log(`\n\n📊 恢复统计:`)
    console.log(`✅ 成功恢复: ${recovered} 篇`)
    console.log(`❌ 恢复失败: ${failed} 篇`)

  } catch (error) {
    console.error('❌ 恢复过程中出现错误:', error)
  }
}

recoverNetdiskLinks()