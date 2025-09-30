import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get('text') || '图片'
  const width = parseInt(searchParams.get('width') || '600')
  const height = parseInt(searchParams.get('height') || '300')

  // 创建一个简单的SVG占位图
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="${Math.min(width, height) / 15}"
            font-weight="500"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="white"
            opacity="0.8">
        ${text}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}