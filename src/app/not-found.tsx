import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          页面不存在
        </h2>

        <p className="text-gray-600 mb-8">
          抱歉，您访问的页面不存在或已被删除。
        </p>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            返回首页
          </Link>

          <div className="text-sm text-gray-500">
            或者尝试
            <Link href="/posts" className="text-blue-600 hover:text-blue-800 mx-1">
              浏览文章
            </Link>
            或
            <Link href="/categories" className="text-blue-600 hover:text-blue-800 mx-1">
              查看分类
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}