import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          页面不存在
        </h1>
        <p className="text-gray-500 mb-6">
          您访问的页面不存在或已被删除
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/posts"
            className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            浏览资源
          </Link>
        </div>
      </div>
    </div>
  )
}
