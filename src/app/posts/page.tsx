import PostCard from '@/components/PostCard'
import { getPostsPaginated, getSiteName } from '@/lib/queries'
import { Post } from '@/types'
import Link from 'next/link'

const PAGE_SIZE = 12

export async function generateMetadata() {
  const siteName = await getSiteName()
  return {
    title: `所有文章 - ${siteName}`,
    description: '浏览所有博客文章',
  }
}

export const revalidate = 0

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const { posts, total } = await getPostsPaginated(currentPage, PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          所有文章
        </h1>
        <p className="text-gray-600">
          共 {total} 篇文章，第 {currentPage}/{totalPages} 页
        </p>
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
            还没有文章
          </h3>
          <p className="text-gray-600">
            请先在Sanity CMS中添加一些文章内容
          </p>
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-2 mt-12">
          {/* 上一页 */}
          {currentPage > 1 ? (
            <Link
              href={`/posts?page=${currentPage - 1}`}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-all duration-200"
            >
              上一页
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed">
              上一页
            </span>
          )}

          {/* 页码 */}
          {generatePageNumbers(currentPage, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="px-2 text-gray-400">...</span>
            ) : (
              <Link
                key={p}
                href={`/posts?page=${p}`}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === p
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {p}
              </Link>
            )
          )}

          {/* 下一页 */}
          {currentPage < totalPages ? (
            <Link
              href={`/posts?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-all duration-200"
            >
              下一页
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed">
              下一页
            </span>
          )}
        </nav>
      )}
    </div>
  )
}

// 生成页码数组，如: [1, 2, '...', 5, 6, 7, '...', 10, 11]
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []

  // 始终显示第 1 页
  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  // 当前页附近
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  // 始终显示最后一页
  pages.push(total)

  return pages
}
