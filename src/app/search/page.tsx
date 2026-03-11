'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { searchPosts } from '@/lib/queries'
import { Post } from '@/types'

function SearchResults() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const cache = useRef<Map<string, Post[]>>(new Map())
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null)

  // 从 URL 参数初始化输入值
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q) {
      setInputValue(q)
      doSearch(q)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setPosts([])
      setSearched(false)
      return
    }

    setSearched(true)

    // 缓存命中，秒出
    const cached = cache.current.get(trimmed)
    if (cached) {
      setPosts(cached)
      return
    }

    setLoading(true)
    try {
      const results = await searchPosts(trimmed)
      cache.current.set(trimmed, results)
      setPosts(results)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // 清除之前的防抖定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // 300ms 防抖
    debounceTimer.current = setTimeout(() => {
      // 更新 URL 参数（不触发页面刷新）
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }
      router.replace(`/search?${params.toString()}`, { scroll: false })
      doSearch(value)
    }, 300)
  }, [searchParams, router, doSearch])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return (
    <>
      {/* 内联搜索框 */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="输入关键词搜索文章..."
            autoFocus
            className="w-full px-6 py-4 text-lg rounded-2xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-300 bg-white shadow-sm"
          />
          <svg
            className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {!searched ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            输入关键词搜索文章
          </h2>
          <p className="text-gray-600">
            在所有文章中查找您感兴趣的内容
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">搜索中...</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              搜索结果
            </h2>
            <p className="text-gray-600">
              为 &ldquo;{inputValue.trim()}&rdquo; 找到 {posts.length} 篇文章
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: Post) => (
                <PostCard key={post._id} post={post} />
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
