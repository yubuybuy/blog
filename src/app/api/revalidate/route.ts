import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // 刷新首页和文章页面的缓存
    revalidatePath('/')
    revalidatePath('/posts')

    console.log('缓存已刷新')

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