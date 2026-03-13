// 自动恢复网盘链接到文章
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

// 解析链接文件
function parseLinksFile() {
  const content = fs.readFileSync('netdisk-links-to-restore.txt', 'utf8')
  const lines = content.split('\n')
  const linkMap = {}

  let currentTitle = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 匹配标题行（1. 《xxx》或 1.《xxx》，支持各种格式）
    const titleMatch = line.match(/^\d+\.\s*《(.+?)》/)
    if (titleMatch) {
      currentTitle = titleMatch[1]
      // 检查下一行是否有链接
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const linkMatch = nextLine.match(/链接[：:]\s*(https:\/\/pan\.quark\.cn\/s\/[a-zA-Z0-9]+)/)
        if (linkMatch && currentTitle) {
          linkMap[currentTitle] = linkMatch[1]
          currentTitle = null
        }
      }
    }
  }

  return linkMap
}

async function restoreLinks() {
  try {
    console.log('🔄 开始恢复网盘链接...\n')

    // 解析链接文件
    const linkMap = parseLinksFile()
    console.log(`📋 解析到 ${Object.keys(linkMap).length} 个网盘链接\n`)

    // 查询所有文章
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] {
        _id,
        title,
        markdownContent
      }
    `)

    let successCount = 0
    let failCount = 0

    for (const post of posts) {
      // 检查标题是否匹配
      let matchedTitle = null
      for (const title in linkMap) {
        if (post.title.includes(title)) {
          matchedTitle = title
          break
        }
      }

      if (!matchedTitle) {
        continue
      }

      const netdiskLink = linkMap[matchedTitle]
      console.log(`📝 处理文章: ${post.title}`)
      console.log(`   链接: ${netdiskLink}`)

      // 检查是否已有链接
      if (post.markdownContent && post.markdownContent.includes(netdiskLink)) {
        console.log(`   ℹ️  文章已包含此链接，跳过\n`)
        continue
      }

      // 在文章末尾添加资源获取部分
      const resourceSection = `\n\n**📁 资源获取**\n\n[获取观看资源](${netdiskLink})\n`
      const updatedContent = post.markdownContent + resourceSection

      try {
        await client
          .patch(post._id)
          .set({ markdownContent: updatedContent })
          .commit()

        console.log(`   ✅ 已成功添加链接\n`)
        successCount++
      } catch (error) {
        console.log(`   ❌ 更新失败: ${error.message}\n`)
        failCount++
      }
    }

    console.log('\n📊 恢复完成统计:')
    console.log(`✅ 成功: ${successCount} 篇`)
    console.log(`❌ 失败: ${failCount} 篇`)
    console.log(`📋 总计: ${Object.keys(linkMap).length} 个链接`)

  } catch (error) {
    console.error('❌ 恢复过程中出现错误:', error)
  }
}

restoreLinks()