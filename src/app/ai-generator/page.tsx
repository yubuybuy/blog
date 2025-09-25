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

// 简单的密码验证组件
function PasswordProtection({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 更安全的管理员密码
    const correctPassword = 'SecureAI#2024!@#'

    if (password === correctPassword) {
      onSuccess()
      setError('')
    } else {
      setError('密码错误，请联系管理员获取访问权限')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🔐 访问控制</h1>
          <p className="text-gray-600">AI内容生成器需要管理员权限</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">访问密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入管理员密码"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            🔓 验证访问权限
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            此页面受到保护以防止未授权访问和API滥用
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AIContentGenerator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [resource, setResource] = useState<ResourceInfo>({
    title: '',
    category: '电影',
    files: [],
    tags: [],
    description: '',
    downloadLink: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState<string>('')
  const [publishedPost, setPublishedPost] = useState<any>(null)
  // 添加使用限制
  const [usageCount, setUsageCount] = useState(0)
  const [lastUsageTime, setLastUsageTime] = useState<number | null>(null)

  // 每次会话最多使用3次，每次使用间隔至少30秒
  const MAX_USAGE_PER_SESSION = 3
  const MIN_INTERVAL_MS = 30000 // 30秒

  // 如果未认证，显示密码输入界面
  if (!isAuthenticated) {
    return <PasswordProtection onSuccess={() => setIsAuthenticated(true)} />
  }

  const handleTagsChange = (tagsStr: string) => {
    const tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag)
    setResource(prev => ({ ...prev, tags }))
  }

  const generateContent = async (publishImmediately = false) => {
    if (!resource.title) {
      setError('请填写资源标题')
      return
    }

    // 检查使用限制
    const now = Date.now()

    if (usageCount >= MAX_USAGE_PER_SESSION) {
      setError(`本次会话已达到使用上限（${MAX_USAGE_PER_SESSION}次），请刷新页面重新验证`)
      return
    }

    if (lastUsageTime && (now - lastUsageTime) < MIN_INTERVAL_MS) {
      const remainingSeconds = Math.ceil((MIN_INTERVAL_MS - (now - lastUsageTime)) / 1000)
      setError(`请等待 ${remainingSeconds} 秒后再次使用，防止滥用`)
      return
    }

    setIsGenerating(true)
    setIsPublishing(publishImmediately)
    setError('')
    setGeneratedContent(null)
    setPublishedPost(null)

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource,
          generateOnly: !publishImmediately
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContent(data.content)
        if (publishImmediately && data.published) {
          setPublishedPost(data.published)
        }
        // 更新使用统计
        setUsageCount(prev => prev + 1)
        setLastUsageTime(now)
      } else {
        setError(data.error || '生成失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('生成错误:', err)
    } finally {
      setIsGenerating(false)
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 安全提示 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">🔐</span>
              <span className="text-green-800 font-medium">已通过安全验证 - 管理员模式</span>
              <span className="text-gray-500 text-sm ml-4">
                使用次数: {usageCount}/{MAX_USAGE_PER_SESSION}
              </span>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-green-600 hover:text-green-800 text-sm underline"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 使用限制警告 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div className="text-yellow-800 text-sm">
              <strong>防滥用限制：</strong>
              <ul className="list-disc list-inside mt-1">
                <li>每次会话最多使用 {MAX_USAGE_PER_SESSION} 次</li>
                <li>每次使用间隔至少 30 秒</li>
                <li>请合理使用，避免重复生成相同内容</li>
              </ul>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">🤖 AI内容生成器</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 输入表单 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📝 资源信息</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">资源标题 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={resource.title}
                  onChange={(e) => setResource(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：阿凡达：水之道"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">分类</label>
                <select
                  value={resource.category}
                  onChange={(e) => setResource(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="电影">🎬 电影</option>
                  <option value="电视剧">📺 电视剧</option>
                  <option value="纪录片">📹 纪录片</option>
                  <option value="动画">🎨 动画</option>
                  <option value="软件">💻 软件</option>
                  <option value="游戏">🎮 游戏</option>
                  <option value="音乐">🎵 音乐</option>
                  <option value="书籍">📚 书籍</option>
                  <option value="其他">📦 其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">标签</label>
                <input
                  type="text"
                  value={resource.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="例如：科幻, 动作, IMAX, 4K"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用逗号分隔多个标签
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">资源描述</label>
                <textarea
                  value={resource.description}
                  onChange={(e) => setResource(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述资源特点..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">网盘链接 <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  value={resource.downloadLink}
                  onChange={(e) => setResource(prev => ({ ...prev, downloadLink: e.target.value }))}
                  placeholder="例如：https://pan.baidu.com/s/xxx 或其他网盘链接"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-red-500">必填：</span>支持百度网盘、阿里云盘、夸克网盘等各种网盘链接。如果没有链接，发布的文章将不包含下载链接。
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => generateContent(false)}
                  disabled={isGenerating}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? '🔄 生成中...' : '👁️ 预览生成'}
                </button>
                <button
                  onClick={() => generateContent(true)}
                  disabled={isGenerating}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isPublishing ? '📤 发布中...' : '🚀 生成并发布'}
                </button>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  ❌ {error}
                </div>
              )}
            </div>
          </div>

          {/* 生成结果 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📄 生成结果</h2>

            {!generatedContent && !isGenerating && (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">🤖</div>
                <p>填写左侧信息后点击生成按钮</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-12">
                <div className="animate-spin text-4xl mb-4">⚡</div>
                <p className="text-blue-600">AI正在生成内容，请稍候...</p>
                {isPublishing && (
                  <p className="text-green-600 mt-2">生成完成后将自动发布</p>
                )}
              </div>
            )}

            {generatedContent && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">🎯 生成标题</h3>
                  <p className="bg-gray-50 p-3 rounded text-lg font-semibold">{generatedContent.title}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">📝 文章摘要</h3>
                  <p className="bg-gray-50 p-3 rounded">{generatedContent.excerpt}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">🏷️ 生成标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">📄 文章内容</h3>
                  <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent.content}</pre>
                  </div>
                </div>

                {publishedPost && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-2">✅ 发布成功</h3>
                    <p className="text-green-700">文章已成功发布到网站！</p>
                    <p className="text-xs text-green-600 mt-1">文档ID: {publishedPost._id}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}