import PostCard from '@/components/PostCard'
import { getPostsPaginated, getSiteName } from '@/lib/queries'
import { Post } from '@/types'
import Link from 'next/link'

const PAGE_SIZE = 12

export async function generateMetadata() {
  const siteName = await getSiteName()
  return {
    title: `全部资源 - ${siteName}`,
    description: '浏览所有网盘资源',
  }
}

export const revalidate = 60

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const { posts, total } = await getPostsPaginated(currentPage, PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">全部资源</h1>
        <p className="text-sm text-gray-500">
          共 {total} 个资源，第 {currentPage}/{totalPages} 页
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {posts.map((post: Post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">暂无内容</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-1 mt-8">
          {currentPage > 1 ? (
            <Link
              href={`/posts?page=${currentPage - 1}`}
              className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              上一页
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded text-sm text-gray-300">上一页</span>
          )}

          {generatePageNumbers(currentPage, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="px-2 text-gray-300 text-sm">...</span>
            ) : (
              <Link
                key={p}
                href={`/posts?page=${p}`}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
                  currentPage === p
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </Link>
            )
          )}

          {currentPage < totalPages ? (
            <Link
              href={`/posts?page=${currentPage + 1}`}
              className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              下一页
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded text-sm text-gray-300">下一页</span>
          )}
        </nav>
      )}
    </div>
  )
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}
