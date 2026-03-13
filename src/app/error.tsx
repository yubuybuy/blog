'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">:(</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          页面出现了问题
        </h1>
        <p className="text-gray-600 mb-8">
          {error.message || '加载过程中出现了意外错误，请稍后重试。'}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          重新加载
        </button>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
