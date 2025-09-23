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
                🎬 浏览影评
              </Link>
              <Link
                href="/ai-generator"
                className="bg-white text-gray-800 px-8 py-4 rounded-full font-semibold text-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                🤖 AI创作
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
        {/* Categories - 卡片式设计 */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">🎭 电影分类</h2>
            <p className="text-gray-600 text-lg">探索不同类型的精彩电影</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category: Category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug.current}`}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 hover:border-purple-200 transition-all duration-300 text-center"
              >
                <div className="text-2xl mb-2">🎬</div>
                <div className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                  {category.title}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Posts - 现代化卡片网格 */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">🌟 最新影评</h2>
            <p className="text-gray-600 text-lg mb-6">发现值得观看的精彩电影</p>
            <Link
              href="/posts"
              className="inline-flex items-center text-purple-600 hover:text-purple-800 font-semibold text-lg group"
            >
              查看全部
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {posts.slice(0, 6).map((post: Post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-4">📽️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                暂无影评文章
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                开始创作第一篇精彩影评吧
              </p>
              <Link
                href="/ai-generator"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                🚀 立即创作
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
