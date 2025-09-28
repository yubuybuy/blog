'use client'

import { useState, useEffect } from 'react'

interface RecycleBinItem {
  _id: string
  title: string
  excerpt: string
  publishedAt: string
  deletedAt: string
  _updatedAt: string
}

export default function RecycleBinTab() {
  const [items, setItems] = useState<RecycleBinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState<string | null>(null)

  // 加载回收站内容
  const loadRecycleBin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recycle-bin')
      const data = await response.json()
      if (data.success) {
        setItems(data.items || [])
      } else {
        alert('加载回收站失败: ' + data.error)
      }
    } catch (error) {
      alert('加载回收站失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 恢复文章
  const restoreItem = async (id: string) => {
    if (!confirm('确定要恢复这篇文章吗？')) return

    setOperationLoading(id)
    try {
      const response = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, action: 'restore' })
      })

      const data = await response.json()
      if (data.success) {
        alert('文章已恢复')
        loadRecycleBin() // 重新加载
      } else {
        alert('恢复失败: ' + data.error)
      }
    } catch (error) {
      alert('恢复失败')
      console.error(error)
    } finally {
      setOperationLoading(null)
    }
  }

  // 永久删除文章
  const permanentDelete = async (id: string) => {
    if (!confirm('警告：这将永久删除文章，无法恢复！确定继续吗？')) return
    if (!confirm('请再次确认：真的要永久删除这篇文章吗？')) return

    setOperationLoading(id)
    try {
      const response = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, action: 'permanent_delete' })
      })

      const data = await response.json()
      if (data.success) {
        alert('文章已永久删除')
        loadRecycleBin() // 重新加载
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

  // 清空回收站
  const clearRecycleBin = async () => {
    if (items.length === 0) {
      alert('回收站已经是空的')
      return
    }

    if (!confirm(`警告：这将永久删除回收站中的所有 ${items.length} 篇文章！确定继续吗？`)) return
    if (!confirm('请再次确认：真的要清空整个回收站吗？')) return

    setLoading(true)
    try {
      const response = await fetch('/api/recycle-bin', {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message)
        setItems([]) // 清空列表
      } else {
        alert('清空失败: ' + data.error)
      }
    } catch (error) {
      alert('清空失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecycleBin()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              🗑️ 回收站管理
            </h2>
            <p className="text-gray-600 mt-1">管理已删除的文章，支持恢复或永久删除</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadRecycleBin}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '🔄 刷新中...' : '🔄 刷新'}
            </button>
            <button
              onClick={clearRecycleBin}
              disabled={loading || items.length === 0}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              🧹 清空回收站
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
          ⚠️ <strong>注意：</strong>永久删除的文章将无法恢复，请谨慎操作！
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {items.length}
          </div>
          <div className="text-sm text-gray-500">回收站中的文章</div>
        </div>
      </div>

      {/* 内容列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500">正在加载回收站内容...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">回收站为空</h3>
            <p className="text-gray-500">没有已删除的文章</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 发布时间: {formatDate(item.publishedAt)}</span>
                      <span>🗑️ 删除时间: {formatDate(item.deletedAt)}</span>
                      <span>📝 ID: {item._id.slice(-8)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => restoreItem(item._id)}
                      disabled={operationLoading === item._id}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {operationLoading === item._id ? '⏳' : '↩️ 恢复'}
                    </button>
                    <button
                      onClick={() => permanentDelete(item._id)}
                      disabled={operationLoading === item._id}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {operationLoading === item._id ? '⏳' : '🗑️ 永久删除'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}