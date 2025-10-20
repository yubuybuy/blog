import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-05-03',
})

// 百度主动推送API
export async function POST(request: Request) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: '请提供要推送的URL列表' },
        { status: 400 }
      )
    }

    const token = process.env.BAIDU_PUSH_TOKEN
    const site = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'

    if (!token) {
      return NextResponse.json(
        { error: '未配置百度推送Token' },
        { status: 500 }
      )
    }

    // 推送到百度
    const pushUrl = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`

    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: urls.join('\n'),
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      result,
      pushedUrls: urls,
    })
  } catch (error: any) {
    console.error('百度推送失败:', error)
    return NextResponse.json(
      { error: '推送失败', details: error.message },
      { status: 500 }
    )
  }
}

// 智能推送：轮流推送文章，充分利用百度每日10条配额
export async function GET() {
  try {
    const baseUrl = 'https://www.sswl.top' // 固定使用正式域名
    const DAILY_QUOTA = 10 // 百度每日推送配额

    // 1. 优先获取最近7天内发布的新文章
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentPosts = await client.fetch(`
      *[_type == "post" && !defined(deleted) && publishedAt > $sevenDaysAgo] | order(publishedAt desc) {
        slug,
        title,
        publishedAt
      }
    `, { sevenDaysAgo: sevenDaysAgo.toISOString() })

    console.log(`找到 ${recentPosts.length} 篇最近7天内的文章`)

    let postsToSend = []

    // 如果有新文章，优先推送新文章（最多配额数量）
    if (recentPosts.length > 0) {
      postsToSend = recentPosts.slice(0, DAILY_QUOTA)
      console.log(`推送策略：最近7天有新文章，推送 ${postsToSend.length} 篇`)
    } else {
      // 如果没有新文章，使用轮换策略推送旧文章
      // 获取所有文章
      const allPosts = await client.fetch(`
        *[_type == "post" && !defined(deleted)] | order(publishedAt desc) {
          slug,
          title,
          publishedAt
        }
      `)

      console.log(`没有新文章，从 ${allPosts.length} 篇文章中轮换推送`)

      // 使用当前日期作为种子，每天推送不同的文章
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
      const offset = (dayOfYear * DAILY_QUOTA) % allPosts.length // 每天轮换

      // 获取配额数量的文章（循环获取）
      for (let i = 0; i < Math.min(DAILY_QUOTA, allPosts.length); i++) {
        const index = (offset + i) % allPosts.length
        postsToSend.push(allPosts[index])
      }

      console.log(`推送策略：轮换推送，今天是第 ${dayOfYear} 天，偏移量 ${offset}`)
    }

    // 构建URL列表（确保不超过配额）
    const urls = postsToSend.slice(0, DAILY_QUOTA).map((post: any) => `${baseUrl}/posts/${post.slug.current}`)

    console.log(`准备推送 ${urls.length} 个URL（配额：${DAILY_QUOTA}条/天）`)

    if (urls.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有可推送的文章',
        totalUrls: 0,
        pushedUrls: [],
        articles: []
      })
    }

    // 推送到百度
    const token = process.env.BAIDU_PUSH_TOKEN
    const site = baseUrl

    if (!token) {
      return NextResponse.json(
        { error: '未配置百度推送Token' },
        { status: 500 }
      )
    }

    const pushUrl = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`

    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: urls.join('\n'),
    })

    const result = await response.json()

    console.log('百度推送结果:', result)

    return NextResponse.json({
      success: true,
      result,
      totalUrls: urls.length,
      pushedUrls: urls,
      articles: postsToSend.map((p: any) => ({ title: p.title, publishedAt: p.publishedAt })),
      strategy: recentPosts.length > 0 ? 'new_articles' : 'rotation'
    })
  } catch (error: any) {
    console.error('百度推送失败:', error)
    return NextResponse.json(
      { error: '推送失败', details: error.message },
      { status: 500 }
    )
  }
}
