// 清理现有文章中的SEO导向内容
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

// 清理函数
function cleanSEOContent(content) {
  if (!content) return content

  let cleaned = content

  // 移除SEO关键词引导段标题
  cleaned = cleaned.replace(/\*{0,2}🔍\s*SEO关键词引导段\*{0,2}/g, '')
  cleaned = cleaned.replace(/\*{0,2}SEO关键词引导段\*{0,2}/g, '')

  // 移除SEO结构化内容块
  cleaned = cleaned.replace(/\*{0,2}🧠\s*为什么值得看？\*{0,2}/g, '')
  cleaned = cleaned.replace(/\*{0,2}🎯\s*适合哪些人看？\*{0,2}/g, '')
  cleaned = cleaned.replace(/\*{0,2}📁\s*网盘资源分享\*{0,2}/g, '')

  // 移除相关的答案列表（包括✅标记的内容）
  cleaned = cleaned.replace(/✅\s*[^✅\n]*\n?/g, '')

  // 移除网盘链接和下载相关内容
  cleaned = cleaned.replace(/\[点击获取.*?资源\]\([^)]+\)/g, '')
  cleaned = cleaned.replace(/你可以轻松找到.*?资源.*?\n/g, '')
  cleaned = cleaned.replace(/关注我们.*?\n/g, '')
  cleaned = cleaned.replace(/📁.*?网盘.*?分享.*?\n/g, '')

  // 移除常见的SEO导向表达
  cleaned = cleaned.replace(/如果你正在寻找.*?不二之选[。！]*/g, '')
  cleaned = cleaned.replace(/无论你是.*?关键词.*?[。！]*/g, '')
  cleaned = cleaned.replace(/想要[了解观看获取].*?[资源内容电影].*?/g, '')
  cleaned = cleaned.replace(/更多精彩.*?内容.*?/g, '')

  // 移除过多的SEO符号
  cleaned = cleaned.replace(/[⭐★✅❌🔥💡📚🚀🎯💪🌟✨🎬📱🎥🎮🎯⚡💎✨🌈🚀💫⭐🔥💯]{3,}/g, '')

  // 移除分隔符和装饰符号
  cleaned = cleaned.replace(/────────────────+/g, '')
  cleaned = cleaned.replace(/\*{3,}/g, '')

  // 清理多余的空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.trim()

  return cleaned
}

// 主函数
async function cleanExistingArticles() {
  try {
    console.log('🔍 查找包含SEO内容的文章...')

    // 查询包含SEO关键词的文章（更精确的匹配）
    const postsWithSEO = await client.fetch(`
      *[_type == "post" && !defined(deleted) && (
        markdownContent match "*SEO关键词*" ||
        markdownContent match "*🔍 SEO*" ||
        markdownContent match "*为什么值得看*" ||
        markdownContent match "*适合哪些人看*" ||
        markdownContent match "*网盘资源分享*"
      )] {
        _id,
        title,
        markdownContent,
        _rev
      }
    `)

    console.log(`找到 ${postsWithSEO.length} 篇包含SEO内容的文章`)

    if (postsWithSEO.length === 0) {
      console.log('✅ 没有发现需要清理的文章')
      return
    }

    // 清理每篇文章
    for (const post of postsWithSEO) {
      console.log(`\n🧹 清理文章: ${post.title}`)

      const cleanedContent = cleanSEOContent(post.markdownContent)

      // 检查是否有变化
      if (cleanedContent !== post.markdownContent) {
        console.log('  📝 发现需要清理的内容，正在更新...')

        // 更新文章
        const result = await client
          .patch(post._id)
          .set({ markdownContent: cleanedContent })
          .commit()

        console.log(`  ✅ 文章已更新 (ID: ${post._id})`)
      } else {
        console.log('  ℹ️  文章内容无需更改')
      }
    }

    console.log('\n🎉 SEO内容清理完成！')

  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error)
  }
}

// 运行清理
cleanExistingArticles()