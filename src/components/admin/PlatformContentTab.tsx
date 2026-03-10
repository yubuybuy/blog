'use client'

import { useState, useCallback } from 'react'

interface PostItem {
  _id: string
  title: string
  excerpt?: string
  publishedAt: string
  categories?: { title: string }[]
  downloadLink?: string
  hasPlatformContent: boolean
  platforms: {
    zhihu: boolean
    wechat: boolean
    xiaohongshu: boolean
    toutiao: boolean
  }
}

interface PlatformContent {
  zhihu?: string
  wechat?: string
  xiaohongshu?: string
  toutiao?: string
}

const PLATFORM_LABELS: Record<string, string> = {
  zhihu: '知乎',
  wechat: '微信公众号',
  xiaohongshu: '小红书',
  toutiao: '百家号/头条',
}

const PLATFORM_KEYS = ['zhihu', 'wechat', 'xiaohongshu', 'toutiao'] as const

export default function PlatformContentTab() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'missing' | 'has'>('all')
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [platformContent, setPlatformContent] = useState<PlatformContent | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const authHeader = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
  }), [])

  const [total, setTotal] = useState(0)

  // 加载文章列表
  const loadPosts = async (f?: string, append = false) => {
    setLoading(true)
    try {
      const currentFilter = f || filter
      const currentOffset = append ? posts.length : 0
      const resp = await fetch(`/api/platform-content?filter=${currentFilter}&limit=50&offset=${currentOffset}`, {
        headers: authHeader()
      })
      const data = await resp.json()
      if (append) {
        setPosts(prev => [...prev, ...(data.posts || [])])
      } else {
        setPosts(data.posts || [])
      }
      setTotal(data.total || 0)
      setLoaded(true)
    } catch {
      alert('加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 查看某篇文章的多平台内容
  const viewContent = async (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null)
      setPlatformContent(null)
      return
    }
    try {
      const resp = await fetch(`/api/platform-content?postId=${postId}`, {
        headers: authHeader()
      })
      const data = await resp.json()
      setSelectedPost(postId)
      setPlatformContent(data.post?.platformContent || null)
    } catch {
      alert('获取失败')
    }
  }

  // 为文章生成内容
  const generateForPost = async (postId: string, scope: 'platform' | 'main' | 'all', regenerate = false) => {
    setGenerating(postId)
    try {
      const resp = await fetch('/api/platform-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ postId, regenerate, scope }),
      })
      const data = await resp.json()
      if (data.success && !data.skipped) {
        // 更新列表状态
        setPosts(prev => prev.map(p =>
          p._id === postId
            ? { ...p, hasPlatformContent: true, platforms: { zhihu: true, wechat: true, xiaohongshu: true, toutiao: true } }
            : p
        ))
        // 如果正在查看这篇，更新内容
        if (selectedPost === postId) {
          setPlatformContent(data.platformContent)
        }
        alert(`"${data.title}" 多平台内容生成成功！`)
      } else if (data.skipped) {
        if (selectedPost === postId) {
          setPlatformContent(data.platformContent)
        }
        alert('该文章已有多平台内容')
      } else {
        alert(`生成失败: ${data.error}`)
      }
    } catch {
      alert('请求失败，请重试')
    } finally {
      setGenerating(null)
    }
  }

  // 批量生成（缺少多平台内容的文章）
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })

  const batchGenerate = async () => {
    const missing = posts.filter(p => !p.hasPlatformContent)
    if (missing.length === 0) { alert('所有文章都已有多平台内容'); return }
    if (!confirm(`将为 ${missing.length} 篇文章生成多平台内容，确定继续？`)) return

    setBatchGenerating(true)
    setBatchProgress({ done: 0, total: missing.length })

    for (let i = 0; i < missing.length; i++) {
      const post = missing[i]
      try {
        const resp = await fetch('/api/platform-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ postId: post._id, scope: 'platform' }),
        })
        const data = await resp.json()
        if (data.success) {
          setPosts(prev => prev.map(p =>
            p._id === post._id
              ? { ...p, hasPlatformContent: true, platforms: { zhihu: true, wechat: true, xiaohongshu: true, toutiao: true } }
              : p
          ))
        }
      } catch { /* continue */ }
      setBatchProgress({ done: i + 1, total: missing.length })
      // 间隔 3 秒避免 API 过载
      if (i < missing.length - 1) {
        await new Promise(r => setTimeout(r, 3000))
      }
    }

    setBatchGenerating(false)
    alert('批量生成完成！')
  }

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      alert('复制失败')
    }
  }

  const handleFilterChange = (f: 'all' | 'missing' | 'has') => {
    setFilter(f)
    setSelectedPost(null)
    setPlatformContent(null)
    loadPosts(f)
  }

  const missingCount = posts.filter(p => !p.hasPlatformContent).length
  const hasCount = posts.filter(p => p.hasPlatformContent).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">多平台内容管理</h2>
            <p className="text-gray-600 mt-1">查看、生成、复制各平台推广内容 · 支持重新生成主站/平台/全部内容</p>
          </div>
          <div className="text-right">
            {loaded && <p className="text-xs text-gray-400 mb-1">已加载 {posts.length} / {total} 篇</p>}
            <button onClick={() => loadPosts()} disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? '加载中...' : loaded ? '刷新列表' : '加载文章'}
            </button>
          </div>
        </div>

        {loaded && (
          <div className="flex items-center gap-4">
            {/* 筛选 */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => handleFilterChange('all')}
                className={`px-3 py-1 text-xs rounded ${filter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}>
                全部 ({posts.length})
              </button>
              <button onClick={() => handleFilterChange('missing')}
                className={`px-3 py-1 text-xs rounded ${filter === 'missing' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600'}`}>
                未生成 ({missingCount})
              </button>
              <button onClick={() => handleFilterChange('has')}
                className={`px-3 py-1 text-xs rounded ${filter === 'has' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'}`}>
                已生成 ({hasCount})
              </button>
            </div>

            {/* 批量生成 */}
            {missingCount > 0 && (
              <button onClick={batchGenerate} disabled={batchGenerating}
                className="px-4 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:bg-gray-400">
                {batchGenerating
                  ? `批量生成中 (${batchProgress.done}/${batchProgress.total})...`
                  : `批量生成 (${missingCount} 篇)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 文章列表 */}
      {loaded && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="divide-y divide-gray-100">
            {posts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>{filter === 'missing' ? '所有文章都已有多平台内容' : '没有找到文章'}</p>
              </div>
            ) : posts.map(post => (
              <div key={post._id}>
                {/* 文章行 */}
                <div className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                  {/* 状态指示 */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${post.hasPlatformContent ? 'bg-green-500' : 'bg-gray-300'}`} />

                  {/* 标题 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-500">
                      {post.categories?.map(c => c.title).join(', ') || '未分类'}
                      {' · '}
                      {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>

                  {/* 平台标签 */}
                  {post.hasPlatformContent && (
                    <div className="hidden md:flex gap-1">
                      {PLATFORM_KEYS.map(k => (
                        <span key={k} className={`px-1.5 py-0.5 text-xs rounded ${
                          post.platforms[k] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {PLATFORM_LABELS[k].slice(0, 2)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-1 flex-shrink-0">
                    {post.hasPlatformContent && (
                      <button onClick={() => viewContent(post._id)}
                        className={`px-2 py-1 text-xs rounded ${
                          selectedPost === post._id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}>
                        {selectedPost === post._id ? '收起' : '查看'}
                      </button>
                    )}
                    <button
                      onClick={() => generateForPost(post._id, 'platform', post.hasPlatformContent)}
                      disabled={generating === post._id}
                      className="px-2 py-1 text-xs rounded bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:bg-gray-200 disabled:text-gray-400">
                      {generating === post._id ? '生成中...' : post.hasPlatformContent ? '重生平台' : '生成平台'}
                    </button>
                    <button
                      onClick={() => generateForPost(post._id, 'main', true)}
                      disabled={generating === post._id}
                      className="px-2 py-1 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100 disabled:bg-gray-200 disabled:text-gray-400">
                      重生主站
                    </button>
                    <button
                      onClick={() => generateForPost(post._id, 'all', true)}
                      disabled={generating === post._id}
                      className="px-2 py-1 text-xs rounded bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:bg-gray-200 disabled:text-gray-400">
                      全部重生
                    </button>
                  </div>
                </div>

                {/* 展开的平台内容 */}
                {selectedPost === post._id && platformContent && (
                  <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                      {PLATFORM_KEYS.map(key => {
                        const content = platformContent[key]
                        if (!content) return (
                          <div key={key} className="border border-dashed border-gray-300 rounded-lg p-3">
                            <span className="text-xs text-gray-400">{PLATFORM_LABELS[key]} - 未生成</span>
                          </div>
                        )
                        return (
                          <div key={key} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                              <span className="text-xs font-medium text-gray-700">{PLATFORM_LABELS[key]}</span>
                              <button
                                onClick={() => handleCopy(key, content)}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  copiedKey === key ? 'bg-green-100 text-green-700' : 'text-blue-600 hover:bg-blue-50'
                                }`}>
                                {copiedKey === key ? '已复制' : '复制'}
                              </button>
                            </div>
                            <pre className="p-3 text-xs overflow-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                              {content}
                            </pre>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* 加载更多 */}
          {posts.length < total && (
            <div className="p-4 text-center border-t">
              <button onClick={() => loadPosts(undefined, true)} disabled={loading}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400">
                {loading ? '加载中...' : `加载更多 (还有 ${total - posts.length} 篇)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
