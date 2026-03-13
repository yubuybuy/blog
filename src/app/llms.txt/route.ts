import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export const revalidate = 3600 // 1小时缓存

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'

  // 从 Sanity 获取热门文章和分类
  const [posts, categories, siteSettings] = await Promise.all([
    client.fetch(`
      *[_type == "post" && !defined(deleted)] | order(publishedAt desc) [0...30] {
        title,
        slug,
        excerpt,
        publishedAt,
        categories[]->{ title }
      }
    `),
    client.fetch(`
      *[_type == "category"] | order(title asc) {
        title,
        slug,
        description
      }
    `),
    client.fetch(`
      *[_type == "siteSettings"][0] {
        title,
        heroSubtitle
      }
    `)
  ])

  const siteName = siteSettings?.title || 'USEIT库'
  const siteDesc = siteSettings?.heroSubtitle || '中文网盘资源分享博客'

  let content = `# ${siteName} (${baseUrl})\n\n`
  content += `> ${siteDesc}\n\n`

  content += `## 关于本站\n`
  content += `${siteName}是一个专注于网盘资源分享的中文博客网站。网站提供电影、软件、游戏等优质资源的详细介绍和下载链接。\n\n`

  content += `## 内容分类\n`
  for (const cat of categories) {
    content += `- [${cat.title}](${baseUrl}/categories/${cat.slug.current})`
    if (cat.description) content += `: ${cat.description}`
    content += `\n`
  }
  content += `\n`

  content += `## 主要页面\n`
  content += `- [首页](${baseUrl}/): 最新资源推荐\n`
  content += `- [文章列表](${baseUrl}/posts): 所有资源文章\n`
  content += `- [分类浏览](${baseUrl}/categories): 按类别浏览资源\n`
  content += `- [搜索](${baseUrl}/search): 搜索站内资源\n`
  content += `- [关于](${baseUrl}/about): 关于本站\n\n`

  content += `## 最新文章\n`
  for (const post of posts) {
    const cats = post.categories?.map((c: { title: string }) => c.title).join(', ') || ''
    content += `- [${post.title}](${baseUrl}/posts/${post.slug.current})`
    if (cats) content += ` [${cats}]`
    if (post.excerpt) content += ` - ${post.excerpt.slice(0, 80)}`
    content += `\n`
  }
  content += `\n`

  content += `## 文章结构\n`
  content += `每篇文章包含：标题、摘要、详细内容（资源介绍、评价、推荐理由）、分类标签、封面图片、网盘下载链接\n\n`

  content += `## 技术栈\n`
  content += `- 前端：Next.js + React + Tailwind CSS\n`
  content += `- CMS：Sanity\n`
  content += `- 部署：Vercel\n`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
