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

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
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

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return (
    <>
      <div className="max-w-lg mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="输入关键词搜索..."
            autoFocus
            className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-300 outline-none transition-all"
          />
          <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {!searched ? (
        <div className="text-center py-12 text-gray-400">
          输入关键词搜索资源
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
          <p className="mt-3 text-sm text-gray-500">搜索中...</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            找到 {posts.length} 个关于「{inputValue.trim()}」的结果
          </p>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {posts.map((post: Post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              未找到相关内容，试试其他关键词
            </div>
          )}
        </>
      )}
    </>
  )
}

export default function SearchPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">搜索</h1>
        <p className="text-sm text-gray-500">在所有资源中查找</p>
      </div>

      <Suspense fallback={
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  )
}
