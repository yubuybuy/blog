import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

// 获取所有文章URL并推送
export async function GET() {
  try {
    const baseUrl = 'https://www.sswl.top' // 固定使用正式域名

    // 获取sitemap中的所有URL
    const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
    const sitemapText = await sitemapResponse.text()

    // 解析sitemap获取所有URL
    const urlMatches = sitemapText.match(/<loc>(.*?)<\/loc>/g)
    let urls = urlMatches
      ? urlMatches.map(match => match.replace(/<\/?loc>/g, ''))
      : []

    // 确保所有URL都使用正式域名
    urls = urls.map(url => url.replace(/https:\/\/[^\/]+/, baseUrl))

    if (urls.length === 0) {
      return NextResponse.json(
        { error: '未找到可推送的URL' },
        { status: 404 }
      )
    }

    // 调用POST方法推送
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

    return NextResponse.json({
      success: true,
      result,
      totalUrls: urls.length,
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
