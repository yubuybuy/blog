import Link from 'next/link'
import { getCategories, getSiteName } from '@/lib/queries'
import { Category } from '@/types'

export async function generateMetadata() {
  const siteName = await getSiteName()
  return {
    title: `分类 - ${siteName}`,
    description: '浏览所有文章分类',
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          文章分类
        </h1>
        <p className="text-gray-600">
          按主题浏览文章
        </p>
      </div>

      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: Category) => (
            <Link
              key={category._id}
              href={`/categories/${category.slug.current}`}
              className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {category.title}
              </h2>
              {category.description && (
                <p className="text-gray-600">
                  {category.description}
                </p>
              )}
              <div className="mt-4 inline-flex items-center text-blue-600 font-medium">
                查看文章
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            还没有分类
          </h3>
          <p className="text-gray-600">
            请先在Sanity CMS中添加一些分类
          </p>
        </div>
      )}
    </div>
  )
}