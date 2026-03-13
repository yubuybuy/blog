/**
 * 百度推送 URL 生成器
 * 自动生成今天需要推送的 URL 列表
 *
 * 使用方法：
 * node get-today-urls.js
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// 读取 .env.local 文件
try {
  const envPath = join(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=')
      if (key && values.length > 0) {
        process.env[key] = values.join('=').replace(/^["']|["']$/g, '')
      }
    }
  })
} catch (error) {
  // 如果读取失败，使用环境变量
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-05-03',
})

const baseUrl = 'https://www.sswl.top'

async function getTodayUrls() {
  console.log('\n🚀 百度推送 URL 生成器')
  console.log('=' .repeat(60))

  try {
    // 获取最近7天的文章
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentPosts = await client.fetch(`
      *[_type == "post" && !defined(deleted) && publishedAt > $sevenDaysAgo]
      | order(publishedAt desc) [0...5] {
        slug,
        title,
        publishedAt
      }
    `, { sevenDaysAgo: sevenDaysAgo.toISOString() })

    // 获取所有文章总数
    const totalPosts = await client.fetch(`
      count(*[_type == "post" && !defined(deleted)])
    `)

    console.log(`\n📊 网站状态`)
    console.log(`   总文章数：${totalPosts} 篇`)
    console.log(`   最近7天新文章：${recentPosts.length} 篇`)

    // ============================================
    // 🚀 快速抓取（每天必做，5-10条配额）
    // ============================================
    console.log('\n\n📍 【快速抓取】每天必做（优先级最高）')
    console.log('=' .repeat(60))
    console.log('操作路径：百度站长 → 资源提交 → 快速抓取')
    console.log('配额限制：5-10 条/天\n')

    const fastCrawlUrls = [
      baseUrl,
      `${baseUrl}/posts`,
    ]

    // 如果有新文章，添加最新的2篇
    if (recentPosts.length > 0) {
      recentPosts.slice(0, 2).forEach(post => {
        fastCrawlUrls.push(`${baseUrl}/posts/${post.slug.current}`)
      })
    }

    console.log('复制以下 URL 到"快速抓取"：\n')
    fastCrawlUrls.forEach(url => console.log(url))

    // 显示文章标题
    if (recentPosts.length > 0) {
      console.log('\n最新文章：')
      recentPosts.slice(0, 2).forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title}`)
        console.log(`     发布时间：${new Date(post.publishedAt).toLocaleString('zh-CN')}`)
      })
    }

    // ============================================
    // 📨 手动提交（每周一次，20条配额）
    // ============================================
    console.log('\n\n📍 【手动提交】每周三操作（20条配额）')
    console.log('=' .repeat(60))
    console.log('操作路径：百度站长 → 资源提交 → 普通收录 → 手动提交\n')

    const manualSubmitUrls = [
      `${baseUrl}/categories`,
      `${baseUrl}/categories/movies`,
      `${baseUrl}/categories/books`,
      `${baseUrl}/categories/tv-series`,
      `${baseUrl}/categories/documentaries`,
      `${baseUrl}/categories/software`,
      `${baseUrl}/categories/music`,
      `${baseUrl}/categories/education`,
      `${baseUrl}/categories/others`,
      `${baseUrl}/about`,
    ]

    console.log('复制以下 URL 到"手动提交"（每周三）：\n')
    manualSubmitUrls.forEach(url => console.log(url))

    // ============================================
    // 🤖 API 推送（自动执行）
    // ============================================
    console.log('\n\n📍 【API 推送】自动执行（无需操作）')
    console.log('=' .repeat(60))
    console.log('GitHub Actions 每天自动推送 10 篇文章')
    console.log('查看日志：https://github.com/yubuybuy/blog/actions')

    // ============================================
    // 📋 今日任务清单
    // ============================================
    console.log('\n\n✅ 【今日任务清单】')
    console.log('=' .repeat(60))
    console.log(`
□ 1. 快速抓取（2分钟）
   - 提交 ${fastCrawlUrls.length} 个 URL（见上方）

□ 2. 查看索引量（1分钟）
   - 路径：数据统计 → 索引量
   - 记录今日索引量：___ 篇

□ 3. 查看抓取频次（1分钟）
   - 路径：数据统计 → 抓取频次
   - 记录今日抓取次数：___ 次
`)

    // ============================================
    // 📅 本周任务提醒
    // ============================================
    const today = new Date().getDay() // 0=周日, 1=周一...
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    console.log(`\n📅 【本周任务】今天是${dayNames[today]}`)
    console.log('=' .repeat(60))

    if (today === 1) { // 周一
      console.log('📊 周一任务：查看搜索流量和关键词排名')
      console.log('   路径：数据统计 → 流量与关键词')
    } else if (today === 3) { // 周三
      console.log('📝 周三任务：手动提交分类页面（见上方"手动提交"部分）')
    } else if (today === 5) { // 周五
      console.log('🔧 周五任务：')
      console.log('   1. 抓取诊断：数据统计 → 抓取诊断')
      console.log('   2. 检查异常：数据统计 → 抓取异常')
    } else {
      console.log('✅ 今天只需完成日常任务（见上方"今日任务清单"）')
    }

    // ============================================
    // 🔗 快速链接
    // ============================================
    console.log('\n\n🔗 【快速链接】')
    console.log('=' .repeat(60))
    console.log('百度站长平台：https://ziyuan.baidu.com/')
    console.log('GitHub Actions：https://github.com/yubuybuy/blog/actions')
    console.log('网站首页：https://www.sswl.top/')
    console.log('Vercel 控制台：https://vercel.com/dashboard')

    // ============================================
    // 💡 提示
    // ============================================
    console.log('\n\n💡 【使用提示】')
    console.log('=' .repeat(60))
    console.log('• 每天运行此脚本，获取最新推送清单')
    console.log('• 复制 URL 到百度站长对应功能')
    console.log('• 记录每天的索引量和抓取频次')
    console.log('• 如有问题，查看"百度SEO推送指南.md"')

    console.log('\n' + '=' .repeat(60))
    console.log('✨ 祝您推送顺利！')
    console.log('=' .repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ 错误：', error.message)
    console.log('\n请检查：')
    console.log('1. .env.local 文件是否存在')
    console.log('2. Sanity 配置是否正确')
    console.log('3. 网络连接是否正常\n')
  }
}

// 运行
getTodayUrls()
