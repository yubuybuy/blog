'use client'

import { useState } from 'react'

interface ResourceInfo {
  title: string;
  category: string;
  files: string[];
  tags: string[];
  description?: string;
  downloadLink?: string;
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
}

// 简化的密码保护组件
function PasswordProtection({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = 'admin2024'

    if (password === correctPassword) {
      onSuccess()
      setError('')
    } else {
      setError('密码错误，请联系管理员获取访问权限')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🔒 AI内容生成器</h1>
          <p className="text-gray-600">请输入访问密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            访问系统
          </button>
        </form>

        <div className="mt-4 text-center">
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            🔐 已启用安全保护
          </div>
        </div>
      </div>
    </div>
  )
}

// AI内容生成器主界面
function AIContentGenerator({ onLogout }: { onLogout: () => void }) {
  const [resource, setResource] = useState<ResourceInfo>({
    title: '',
    category: '',
    files: [],
    tags: [],
    description: '',
    downloadLink: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedContent | null>(null)

  const handleGenerate = async () => {
    if (!resource.title.trim()) {
      alert('请输入资源标题')
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource,
          generateOnly: false // 直接发布
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setResult(data.content)
        alert('内容生成并发布成功！')
      } else {
        throw new Error(data.error || '生成失败')
      }
    } catch (error) {
      console.error('生成错误:', error)
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setResource({ ...resource, tags })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">🤖 AI内容生成器</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✅ 已登录
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                退出登录
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资源标题 *
                </label>
                <input
                  type="text"
                  value={resource.title}
                  onChange={(e) => setResource({ ...resource, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：2024年最新电影合集"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  value={resource.category}
                  onChange={(e) => setResource({ ...resource, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择分类</option>
                  <option value="电影">电影</option>
                  <option value="软件">软件</option>
                  <option value="游戏">游戏</option>
                  <option value="音乐">音乐</option>
                  <option value="教程">教程</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签 (逗号分隔)
                </label>
                <input
                  type="text"
                  value={resource.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：高清,免费,最新"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网盘链接
                </label>
                <input
                  type="url"
                  value={resource.downloadLink}
                  onChange={(e) => setResource({ ...resource, downloadLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="https://pan.baidu.com/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                资源描述
              </label>
              <textarea
                value={resource.description}
                onChange={(e) => setResource({ ...resource, description: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="详细描述资源内容..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !resource.title.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isGenerating ? '🔄 生成中...' : '🚀 生成并发布内容'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">✅ 生成结果</h2>
            <div className="space-y-4">
              <div>
                <strong>标题:</strong> {result.title}
              </div>
              <div>
                <strong>摘要:</strong> {result.excerpt}
              </div>
              <div>
                <strong>标签:</strong> {result.tags.join(', ')}
              </div>
              <div>
                <strong>内容预览:</strong>
                <pre className="mt-2 p-4 bg-gray-50 rounded text-sm overflow-auto max-h-96">
                  {result.content}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 主组件
export default function AIGeneratorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <PasswordProtection onSuccess={handleLogin} />
  }

  return <AIContentGenerator onLogout={handleLogout} />
}