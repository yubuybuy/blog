'use client'

import { useState, useEffect } from 'react'

interface NetdiskLink {
  id: number
  platform: string
  url: string
  password: string
  title: string
  chat_id: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at?: string
}

interface Stats {
  total: number
  pending: number
  completed: number
  failed: number
  platforms: { platform: string; count: number }[]
}

export default function TelegramQuarkManager() {
  const [links, setLinks] = useState<NetdiskLink[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await fetch('/api/telegram-quark?action=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  // 加载链接列表
  const loadLinks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/telegram-quark?action=links&${params}`)
      const result = await response.json()
      if (result.success) {
        setLinks(result.data)
      }
    } catch (error) {
      console.error('加载链接失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 开始转存
  const startTransfer = async () => {
    if (transferring) return

    setTransferring(true)
    try {
      const response = await fetch('/api/telegram-quark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'transfer',
          maxCount: 10
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`转存完成！成功: ${result.data.success}, 失败: ${result.data.failed}`)
        loadStats()
        loadLinks()
      } else {
        alert(`转存失败: ${result.error}`)
      }
    } catch (error) {
      alert(`转存出错: ${error}`)
    } finally {
      setTransferring(false)
    }
  }

  // 更新单个链接状态
  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch('/api/telegram-quark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          id,
          status
        })
      })

      const result = await response.json()
      if (result.success) {
        loadStats()
        loadLinks()
      }
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  useEffect(() => {
    loadStats()
    loadLinks()

    // 定时刷新
    const interval = setInterval(() => {
      loadStats()
      if (!transferring) {
        loadLinks()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedStatus, selectedPlatform])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'quark': return '⚡'
      case 'baidu': return '🟦'
      case 'aliyun': return '☁️'
      case 'tianyi': return '📱'
      case '123pan': return '📁'
      default: return '💾'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Telegram 夸克网盘转存管理
          </h1>
          <p className="text-gray-600">
            自动监听Telegram群组中的网盘链接并批量转存到夸克网盘
          </p>
        </div>

        {/* 统计面板 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="ml-2 text-sm text-gray-500">总链接数</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="ml-2 text-sm text-gray-500">待转存</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="ml-2 text-sm text-gray-500">已完成</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="ml-2 text-sm text-gray-500">失败</div>
              </div>
            </div>
          </div>
        )}

        {/* 控制面板 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有状态</option>
                <option value="pending">待转存</option>
                <option value="processing">转存中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
              </select>

              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有平台</option>
                <option value="quark">夸克网盘</option>
                <option value="baidu">百度网盘</option>
                <option value="aliyun">阿里云盘</option>
                <option value="tianyi">天翼云盘</option>
                <option value="123pan">123云盘</option>
              </select>

              <button
                onClick={loadLinks}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
              >
                {loading ? '刷新中...' : '🔄 刷新'}
              </button>
            </div>

            <button
              onClick={startTransfer}
              disabled={transferring || (stats?.pending || 0) === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {transferring ? '🔄 转存中...' : '🚀 开始转存'}
            </button>
          </div>
        </div>

        {/* 链接列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">网盘链接列表</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平台
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    链接
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    密码
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getPlatformIcon(link.platform)}</span>
                        <span className="text-sm text-gray-900 capitalize">
                          {link.platform}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {link.title || '未知资源'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-blue-600 max-w-xs truncate">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {link.url}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {link.password || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(link.status)}`}>
                        {
                          link.status === 'pending' ? '⏳ 等待' :
                          link.status === 'processing' ? '🔄 转存中' :
                          link.status === 'completed' ? '✅ 完成' :
                          link.status === 'failed' ? '❌ 失败' :
                          link.status
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(link.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {link.status === 'failed' && (
                          <button
                            onClick={() => updateStatus(link.id, 'pending')}
                            className="text-blue-600 hover:text-blue-800"
                            title="重新尝试"
                          >
                            🔄
                          </button>
                        )}
                        {link.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(link.id, 'failed')}
                            className="text-red-600 hover:text-red-800"
                            title="标记为失败"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {links.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-500">没有找到链接数据</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔄</div>
                <p className="text-gray-500">加载中...</p>
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📖 使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">🤖 Telegram Bot设置:</h4>
              <ul className="space-y-1 ml-4">
                <li>• 创建Telegram Bot并获取Token</li>
                <li>• 将Bot添加到监听群组</li>
                <li>• 配置 config/telegram_config.json</li>
                <li>• 运行 python scripts/telegram_listener.py</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ 夸克网盘转存:</h4>
              <ul className="space-y-1 ml-4">
                <li>• 首次使用需要浏览器登录夸克网盘</li>
                <li>• 支持自动批量转存夸克链接</li>
                <li>• 建议使用VIP账号获得更好体验</li>
                <li>• 转存失败的链接可手动重试</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}