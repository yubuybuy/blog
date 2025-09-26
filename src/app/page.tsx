import PostCard from '@/components/PostCard'
import { getPosts, getCategories, getSiteSettings } from '@/lib/queries'
import { Post, Category, SiteSettings } from '@/types'
import Link from 'next/link'

export const revalidate = 0 // 禁用缓存，确保获取最新文章

export default async function Home() {
  const [posts, categories, siteSettings] = await Promise.all([
    getPosts(),
    getCategories(),
    getSiteSettings()
  ])

  // 如果没有设置，使用默认值
  const settings: SiteSettings = siteSettings || {
    title: '个人博客',
    heroTitle: '欢迎来到我的个人空间',
    heroSubtitle: '这里是我记录想法、分享经验、探索世界的地方'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section - 现代化设计 */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto text-center">
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
              {settings.heroTitle}
            </h1>
            {settings.heroSubtitle && (
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                {settings.heroSubtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/posts"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                📖 浏览文章
              </Link>
            </div>
          </div>

          {/* 装饰性背景元素 */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-pink-200 rounded-full opacity-30 animate-bounce"></div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">分类</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category: Category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug.current}`}
                className="bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-lg transition-colors border border-gray-200 hover:border-purple-300 text-center font-medium"
              >
                {category.title}
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Posts */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">最新文章</h2>
            <Link
              href="/posts"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              查看全部 →
            </Link>
          </div>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(0, 6).map((post: Post, index: number) => (
                <PostCard key={`${post._id}-${index}`} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                还没有文章
              </h3>
              <p className="text-gray-600">
                请先在Sanity CMS中添加一些文章内容
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
