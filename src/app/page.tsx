import PostCard from '@/components/PostCard'
import { getPostsPaginated, getCategories, getSiteSettings } from '@/lib/queries'
import { Post, Category, SiteSettings } from '@/types'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

export const revalidate = 60

export default async function Home() {
  const [{ posts, total }, categories, siteSettings] = await Promise.all([
    getPostsPaginated(1, 9),
    getCategories(),
    getSiteSettings()
  ])

  const settings: SiteSettings = siteSettings || {
    title: 'USEIT库',
    heroTitle: '网盘资源分享',
    heroSubtitle: '电影、软件、游戏等优质资源推荐与下载'
  }

  return (
    <>
      <JsonLd type="website" siteSettings={settings} />

      {/* Hero */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {settings.heroTitle}
          </h1>
          {settings.heroSubtitle && (
            <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-6">
              {settings.heroSubtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/posts"
              className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              浏览全部 {total} 个资源
            </Link>
            <Link
              href="/categories"
              className="bg-white text-gray-700 px-5 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              按分类浏览
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Categories */}
        {categories && categories.length > 0 && (
          <section className="mb-8 sm:mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">资源分类</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category: Category) => (
                <Link
                  key={category._id}
                  href={`/categories/${category.slug.current}`}
                  className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-md border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest Posts */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold text-gray-900">最新资源</h2>
            <Link
              href="/posts"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              查看全部 &rarr;
            </Link>
          </div>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {posts.map((post: Post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无内容
            </div>
          )}
        </section>
      </div>
    </>
  )
}
