import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 最长运行60秒

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-05-03',
})

// 定时任务：每天自动推送所有URL到百度
export async function GET(request: Request) {
  try {
    // 验证来自 Vercel Cron 的请求
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 如果不是定时任务调用，手动触发也允许
      console.log('手动触发百度推送')
    }

    const token = process.env.BAIDU_PUSH_TOKEN
    const site = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'

    if (!token) {
      return NextResponse.json(
        { error: '未配置百度推送Token' },
        { status: 500 }
      )
    }

    console.log('开始百度推送任务...')

    // 获取所有文章
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] {
        slug,
        publishedAt
      }
    `)

    console.log(`找到 ${posts.length} 篇文章`)

    // 获取所有分类
    const categories = await client.fetch(`
      *[_type == "category"] {
        slug
      }
    `)

    // 构建URL列表
    const urls = [
      `${site}/`,
      `${site}/posts`,
      `${site}/categories`,
      `${site}/search`,
      ...posts.map((post: { slug: { current: string } }) => `${site}/posts/${post.slug.current}`),
      ...categories.map((cat: { slug: { current: string } }) => `${site}/categories/${cat.slug.current}`)
    ]

    console.log(`准备推送 ${urls.length} 个URL`)

    // 百度推送
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
      timestamp: new Date().toISOString(),
      totalUrls: urls.length,
      result,
    })

  } catch (error: unknown) {
    console.error('百度定时推送失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '推送失败',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
