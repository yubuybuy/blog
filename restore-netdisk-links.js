// 尝试从历史版本恢复网盘链接
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

async function restoreNetdiskLinks() {
  try {
    console.log('🔍 尝试从历史版本恢复网盘链接...\n')

    // 查询所有文章
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] {
        _id,
        title,
        markdownContent
      }
    `)

    console.log(`找到 ${posts.length} 篇文章`)

    for (const post of posts) {
      // 检查是否缺少网盘链接
      const hasNetdiskLink = post.markdownContent && /https?:\/\/pan\.quark\.cn\/s\//.test(post.markdownContent)

      if (!hasNetdiskLink) {
        console.log(`\n❌ ${post.title} - 缺少网盘链接`)

        // 尝试获取文档历史
        try {
          const history = await client.fetch(`*[_id == "${post._id}"][0...10]`)
          console.log(`   找到 ${history.length} 个历史版本`)
        } catch (err) {
          console.log(`   无法获取历史版本: ${err.message}`)
        }
      } else {
        console.log(`✅ ${post.title} - 有网盘链接`)
      }
    }

    console.log('\n\n💡 提示：')
    console.log('Sanity CMS的历史版本需要在Sanity Studio中手动查看和恢复。')
    console.log('请访问 https://www.sanity.io/manage 登录后台查看文档历史。')
    console.log('\n或者，如果您有原始的网盘资源数据，我可以帮您重新添加链接。')

  } catch (error) {
    console.error('❌ 恢复过程中出现错误:', error)
  }
}

restoreNetdiskLinks()