import Link from 'next/link'
import { getCategories, getSiteName } from '@/lib/queries'
import { Category } from '@/types'

export const revalidate = 60

export async function generateMetadata() {
  const siteName = await getSiteName()
  return {
    title: `分类 - ${siteName}`,
    description: '按分类浏览网盘资源',
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">资源分类</h1>
        <p className="text-sm text-gray-500">按类别浏览全部资源</p>
      </div>

      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {categories.map((category: Category) => (
            <Link
              key={category._id}
              href={`/categories/${category.slug.current}`}
              className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div>
                <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {category.title}
                </h2>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0 ml-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">暂无分类</div>
      )}
    </div>
  )
}
