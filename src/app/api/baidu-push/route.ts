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

// 获取最新10篇文章并推送
export async function GET() {
  try {
    const baseUrl = 'https://www.sswl.top' // 固定使用正式域名

    // 从 Sanity 获取最新10篇文章，按发布时间倒序排列
    const posts = await client.fetch(`
      *[_type == "post" && !defined(deleted)] | order(publishedAt desc) [0...10] {
        slug,
        title,
        publishedAt
      }
    `)

    console.log(`找到 ${posts.length} 篇最新文章`)

    // 构建URL列表：首页 + 最新10篇文章
    const urls = [
      `${baseUrl}/`,
      ...posts.map((post: any) => `${baseUrl}/posts/${post.slug.current}`)
    ]

    console.log(`准备推送 ${urls.length} 个URL（首页 + 最新${posts.length}篇文章）`)

    if (urls.length === 0) {
      return NextResponse.json(
        { error: '未找到可推送的URL' },
        { status: 404 }
      )
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
      articles: posts.map((p: any) => ({ title: p.title, publishedAt: p.publishedAt }))
    })
  } catch (error: any) {
    console.error('百度推送失败:', error)
    return NextResponse.json(
      { error: '推送失败', details: error.message },
      { status: 500 }
    )
  }
}
