import { MetadataRoute } from 'next'
import { getPosts, getCategories } from '@/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    getPosts(),
    getCategories()
  ])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]

  // Post pages - 按发布时间排序，最新的优先级更高
  const postPages = posts
    .sort((a: any, b: any) => new Date(b.publishedAt || b._updatedAt).getTime() - new Date(a.publishedAt || a._updatedAt).getTime())
    .map((post: any, index: number) => ({
      url: `${baseUrl}/posts/${post.slug.current}`,
      lastModified: new Date(post._updatedAt || post.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: Math.max(0.5, 0.9 - (index * 0.1)), // 最新文章优先级更高
    }))

  // Category pages
  const categoryPages = categories.map((category: any) => ({
    url: `${baseUrl}/categories/${category.slug.current}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...postPages, ...categoryPages]
}