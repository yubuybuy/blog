import PostCard from '@/components/PostCard'
import { getPostsByCategory, getCategories, getSiteName } from '@/lib/queries'
import { Post } from '@/types'
import { notFound } from 'next/navigation'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((category: any) => ({
    slug: category.slug.current,
  }))
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const categories = await getCategories()
  const category = categories.find((cat: any) => cat.slug.current === slug)
  const siteName = await getSiteName()

  if (!category) {
    return {
      title: '分类不存在',
    }
  }

  return {
    title: `${category.title} - ${siteName}`,
    description: category.description || `浏览${category.title}分类下的所有文章`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [posts, categories] = await Promise.all([
    getPostsByCategory(slug),
    getCategories()
  ])

  const category = categories.find((cat: any) => cat.slug.current === slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {category.title}
        </h1>
        {category.description && (
          <p className="text-gray-600 max-w-2xl mx-auto">
            {category.description}
          </p>
        )}
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: Post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            这个分类下还没有文章
          </h3>
          <p className="text-gray-600">
            请添加一些文章到这个分类
          </p>
        </div>
      )}
    </div>
  )
}