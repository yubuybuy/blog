'use client'

import { useState, useEffect } from 'react'

interface Post {
  _id: string
  title: string
  excerpt: string
  publishedAt: string
  categories: Array<{ title: string; slug: { current: string } }>
  _updatedAt: string
}

export default function PostManagementTab() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [operationLoading, setOperationLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 加载文章列表
  const loadPosts = async () => {
    setLoading(true)
    try {
      // 直接使用Sanity client获取文章
      const response = await fetch('/api/posts-management', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts || [])
      } else {
        alert('加载文章失败: ' + data.error)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      // 如果API不存在，我们创建一个临时的获取方法
      alert('加载文章失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 软删除单个文章
  const deletePost = async (postId: string, title: string) => {
    if (!confirm(`确定要删除文章："${title}"吗？\n\n删除后文章将移动到回收站，可以恢复。`)) return

    setOperationLoading(postId)
    try {
      const response = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        },
        body: JSON.stringify({ postId, action: 'soft_delete' })
      })

      const data = await response.json()
      if (data.success) {
        alert('文章已移动到回收站')
        loadPosts() // 重新加载
      } else {
        alert('删除失败: ' + data.error)
      }
    } catch (error) {
      alert('删除失败')
      console.error(error)
    } finally {
      setOperationLoading(null)
    }
  }

  // 批量删除文章
  const batchDelete = async () => {
    if (selectedPosts.size === 0) {
      alert('请先选择要删除的文章')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedPosts.size} 篇文章吗？\n\n删除后文章将移动到回收站，可以恢复。`)) return

    setOperationLoading('batch')
    let successCount = 0
    let failCount = 0

    for (const postId of selectedPosts) {
      try {
        const response = await fetch('/api/recycle-bin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
          },
          body: JSON.stringify({ postId, action: 'soft_delete' })
        })

        const data = await response.json()
        if (data.success) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        failCount++
        console.error('批量删除错误:', error)
      }
    }

    setOperationLoading(null)
    setSelectedPosts(new Set()) // 清空选择
    loadPosts() // 重新加载

    alert(`批量删除完成！\n成功: ${successCount} 篇\n失败: ${failCount} 篇`)
  }

  // 切换选择状态
  const toggleSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set()) // 取消全选
    } else {
      setSelectedPosts(new Set(filteredPosts.map(post => post._id))) // 全选
    }
  }

  // 过滤文章
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    loadPosts()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              📚 文章管理
            </h2>
            <p className="text-gray-600 mt-1">查看、搜索、删除文章（支持批量操作）</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadPosts}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '🔄 刷新中...' : '🔄 刷新'}
            </button>
            <button
              onClick={batchDelete}
              disabled={selectedPosts.size === 0 || operationLoading === 'batch'}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {operationLoading === 'batch' ? '🔄 删除中...' : `🗑️ 批量删除 (${selectedPosts.size})`}
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索文章标题或内容..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            显示 {filteredPosts.length} / {posts.length} 篇文章
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
          ⚠️ <strong>注意：</strong>删除的文章将移动到回收站，可以在&ldquo;回收站管理&rdquo;标签页中恢复。
        </div>
      </div>

      {/* 批量操作栏 */}
      {posts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={filteredPosts.length > 0 && selectedPosts.size === filteredPosts.length}
                  onChange={toggleSelectAll}
                  className="mr-2"
                />
                {selectedPosts.size === filteredPosts.length ? '取消全选' : '全选'}
              </label>
              <span className="text-sm text-gray-500">
                已选择 {selectedPosts.size} 篇文章
              </span>
            </div>
            {selectedPosts.size > 0 && (
              <div className="text-sm text-blue-600">
                💡 提示：选中的文章将批量移动到回收站
              </div>
            )}
          </div>
        </div>
      )}

      {/* 文章列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500">正在加载文章列表...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">{searchTerm ? '🔍' : '📝'}</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm ? '没有找到匹配的文章' : '暂无文章'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? '尝试修改搜索关键词' : '使用AI生成器创建第一篇文章'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <div key={post._id} className={`p-6 hover:bg-gray-50 ${selectedPosts.has(post._id) ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post._id)}
                      onChange={() => toggleSelection(post._id)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 发布: {formatDate(post.publishedAt)}</span>
                      <span>✏️ 更新: {formatDate(post._updatedAt)}</span>
                      {post.categories?.length > 0 && (
                        <span>📁 分类: {post.categories.map(cat => cat.title).join(', ')}</span>
                      )}
                      <span>📝 ID: {post._id.slice(-8)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={`/posts/${post._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      👁️ 预览
                    </a>
                    <button
                      onClick={() => deletePost(post._id, post.title)}
                      disabled={operationLoading === post._id}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {operationLoading === post._id ? '⏳' : '🗑️ 删除'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">💡 使用说明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>删除文章</strong>：点击单个文章的&ldquo;删除&rdquo;按钮，或选中多篇文章批量删除</li>
          <li>• <strong>预览文章</strong>：点击&ldquo;预览&rdquo;按钮在新标签页中查看文章</li>
          <li>• <strong>搜索功能</strong>：输入关键词快速找到目标文章</li>
          <li>• <strong>安全删除</strong>：删除的文章会移动到回收站，在&ldquo;回收站管理&rdquo;中可以恢复</li>
        </ul>
      </div>
    </div>
  )
}