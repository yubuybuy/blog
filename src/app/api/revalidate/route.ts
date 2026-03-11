import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // 读取可选的 slug 参数，用于刷新具体文章页
    let slug: string | null = null
    try {
      const body = await request.json()
      slug = body.slug || null
    } catch { /* 无 body 也正常 */ }

    // 刷新首页和文章列表
    revalidatePath('/')
    revalidatePath('/posts')

    // 刷新具体文章页
    if (slug) {
      revalidatePath(`/posts/${slug}`)
      console.log(`缓存已刷新: / + /posts + /posts/${slug}`)
    } else {
      // 没有指定 slug，刷新所有文章页
      revalidatePath('/posts/[slug]', 'page')
      console.log('缓存已刷新: / + /posts + 所有文章页')
    }

    return NextResponse.json({
      success: true,
      message: '缓存已刷新',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('刷新缓存失败:', error)
    return NextResponse.json({
      success: false,
      error: '刷新缓存失败'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: '使用POST方法刷新缓存'
  })
}