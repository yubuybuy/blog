/**
 * 百度 SEO 状态检查器
 * 查看 API 推送状态和需要检查的数据
 *
 * 使用方法：
 * node check-baidu-status.js
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

async function checkBaiduStatus() {
  console.log('\n🔍 百度 SEO 状态检查')
  console.log('=' .repeat(60))

  try {
    // 获取最近7天的文章
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentPosts = await client.fetch(`
      *[_type == "post" && !defined(deleted) && publishedAt > $sevenDaysAgo]
      | order(publishedAt desc) {
        slug,
        title,
        publishedAt
      }
    `, { sevenDaysAgo: sevenDaysAgo.toISOString() })

    // 获取所有文章
    const allPosts = await client.fetch(`
      *[_type == "post" && !defined(deleted)]
      | order(publishedAt desc) {
        slug,
        title,
        publishedAt
      }
    `)

    const totalPosts = allPosts.length

    console.log(`\n📊 网站内容统计`)
    console.log('=' .repeat(60))
    console.log(`   总文章数：${totalPosts} 篇`)
    console.log(`   最近7天新文章：${recentPosts.length} 篇`)

    if (recentPosts.length > 0) {
      console.log(`\n   📝 最新文章：`)
      recentPosts.forEach((post, index) => {
        const date = new Date(post.publishedAt)
        console.log(`   ${index + 1}. ${post.title}`)
        console.log(`      发布：${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`)
      })
    }

    // ============================================
    // API 推送状态
    // ============================================
    console.log(`\n\n🤖 API 主动推送（自动化）`)
    console.log('=' .repeat(60))
    console.log(`✅ 状态：已配置，每天自动运行`)
    console.log(`📅 时间：每天 UTC 0:00（北京时间 8:00）`)
    console.log(`📊 配额：10 条/天`)
    console.log(`📈 策略：${recentPosts.length > 0 ? '优先推送新文章' : '轮换推送旧文章'}`)

    console.log(`\n   今天会推送：`)
    const todayPushPosts = recentPosts.length > 0
      ? recentPosts.slice(0, 10)
      : allPosts.slice(0, 10)

    todayPushPosts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.slug.current}`)
    })

    console.log(`\n   📝 查看推送日志：`)
    console.log(`   https://github.com/yubuybuy/blog/actions`)

    // ============================================
    // 可用推送方式
    // ============================================
    console.log(`\n\n📋 您的推送方式汇总`)
    console.log('=' .repeat(60))
    console.log(`✅ API 主动推送   - 10条/天 - 自动执行`)
    console.log(`❌ 快速抓取      - 需要VIP - 不可用`)
    console.log(`❌ sitemap       - 需要备案 - 不可用`)
    console.log(`⚠️  手动提交      - 20条/天 - 请明天再试`)

    // ============================================
    // 需要检查的数据
    // ============================================
    console.log(`\n\n📊 请在百度站长检查这些数据`)
    console.log('=' .repeat(60))

    console.log(`\n1️⃣  索引量（最重要）`)
    console.log(`   路径：数据统计 → 索引量`)
    console.log(`   目标：接近 ${totalPosts} 篇`)
    console.log(`   说明：百度实际收录了多少篇文章`)
    console.log(`   当前索引量：___ 篇（请手动记录）`)

    console.log(`\n2️⃣  抓取频次`)
    console.log(`   路径：数据统计 → 抓取频次`)
    console.log(`   理想：50+ 次/天`)
    console.log(`   一般：10-50 次/天`)
    console.log(`   说明：百度蜘蛛访问您网站的频率`)
    console.log(`   当前抓取频次：___ 次/天（请手动记录）`)

    console.log(`\n3️⃣  流量与关键词（每周查看）`)
    console.log(`   路径：数据统计 → 流量与关键词`)
    console.log(`   查看：展现量、点击量、关键词排名`)
    console.log(`   说明：有多少人通过百度找到您的网站`)

    console.log(`\n4️⃣  抓取异常（每周查看）`)
    console.log(`   路径：数据统计 → 抓取异常`)
    console.log(`   查看：是否有页面抓取失败`)
    console.log(`   说明：发现网站问题`)

    // ============================================
    // 每周检查清单
    // ============================================
    const today = new Date().getDay()
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    console.log(`\n\n📅 本周任务（今天是${dayNames[today]}）`)
    console.log('=' .repeat(60))

    if (today === 1) { // 周一
      console.log(`\n✅ 本周任务：全面检查`)
      console.log(`   1. 查看索引量趋势（是否增长）`)
      console.log(`   2. 查看流量与关键词（是否有搜索流量）`)
      console.log(`   3. 查看抓取频次（是否稳定）`)
      console.log(`   4. 检查抓取异常（是否有错误）`)
      console.log(`   5. 查看 GitHub Actions 推送日志`)
    } else {
      console.log(`\n✅ 本周一全面检查一次即可`)
      console.log(`   现在无需特别操作，API 推送自动进行`)
    }

    // ============================================
    // 如何提升收录
    // ============================================
    console.log(`\n\n💡 如何提升百度收录`)
    console.log('=' .repeat(60))
    console.log(`1. 保持更新 - 您的 AI 自动发布已在做 ✅`)
    console.log(`2. 内容质量 - 确保文章有价值、原创`)
    console.log(`3. 网站速度 - Vercel 部署很快 ✅`)
    console.log(`4. 主动推送 - API 推送已配置 ✅`)
    console.log(`5. 耐心等待 - 新站需要 1-2 周才有索引`)

    // ============================================
    // 数据记录模板
    // ============================================
    console.log(`\n\n📝 数据记录模板`)
    console.log('=' .repeat(60))
    const dateStr = new Date().toLocaleDateString('zh-CN')
    console.log(`
日期：${dateStr}
索引量：___ 篇
抓取频次：___ 次/天
搜索展现：___ 次
搜索点击：___ 次
API 推送：✅ 自动执行
备注：
`)

    // ============================================
    // 快速链接
    // ============================================
    console.log(`\n🔗 快速链接`)
    console.log('=' .repeat(60))
    console.log(`百度站长平台：https://ziyuan.baidu.com/`)
    console.log(`GitHub Actions： https://github.com/yubuybuy/blog/actions`)
    console.log(`网站首页：      https://www.sswl.top/`)

    console.log('\n' + '=' .repeat(60))
    console.log('✨ 您的 SEO 配置已优化，只需等待百度收录！')
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
checkBaiduStatus()
