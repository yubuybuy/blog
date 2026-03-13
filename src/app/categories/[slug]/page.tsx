import PostCard from '@/components/PostCard'
import { getPostsByCategory, getCategories, getSiteName } from '@/lib/queries'
import { Post } from '@/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((category: { slug: { current: string } }) => ({
    slug: category.slug.current,
  }))
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const categories = await getCategories()
  const category = categories.find((cat: { slug: { current: string }; title: string; description?: string }) => cat.slug.current === slug)
  const siteName = await getSiteName()

  if (!category) {
    return { title: '分类不存在' }
  }

  return {
    title: `${category.title} - ${siteName}`,
    description: category.description || `浏览${category.title}分类下的所有资源`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [posts, categories] = await Promise.all([
    getPostsByCategory(slug),
    getCategories()
  ])

  const category = categories.find((cat: { slug: { current: string }; title: string; description?: string }) => cat.slug.current === slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/categories" className="hover:text-blue-600 transition-colors">分类</Link>
          <span>/</span>
          <span className="text-gray-900">{category.title}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{category.title}</h1>
        {category.description && (
          <p className="text-sm text-gray-500">{category.description}</p>
        )}
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {posts.map((post: Post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          该分类下暂无内容
        </div>
      )}
    </div>
  )
}
