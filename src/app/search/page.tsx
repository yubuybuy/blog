'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { searchPosts } from '@/lib/queries'
import { Post } from '@/types'

function SearchResults() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  useEffect(() => {
    if (query) {
      setLoading(true)
      setSearched(true)
      searchPosts(query)
        .then(setPosts)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [query])

  if (!searched) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          输入关键词搜索文章
        </h2>
        <p className="text-gray-600">
          使用上方搜索框查找您感兴趣的内容
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">搜索中...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          搜索结果
        </h2>
        <p className="text-gray-600">
          为 "{query}" 找到 {posts.length} 篇文章
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: Post, index: number) => (
            <PostCard key={`${post._id}-${index}`} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            未找到相关文章
          </h3>
          <p className="text-gray-600">
            尝试使用不同的关键词搜索
          </p>
        </div>
      )}
    </>
  )
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          搜索文章
        </h1>
        <p className="text-gray-600">
          在所有文章中查找您需要的内容
        </p>
      </div>

      <Suspense fallback={
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  )
}