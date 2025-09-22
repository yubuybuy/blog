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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          {settings.heroTitle}
        </h1>
        {settings.heroSubtitle && (
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {settings.heroSubtitle}
          </p>
        )}
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">分类</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category: Category) => (
            <Link
              key={category._id}
              href={`/categories/${category.slug.current}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors"
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
            {posts.slice(0, 6).map((post: Post) => (
              <PostCard key={post._id} post={post} />
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
  )
}
