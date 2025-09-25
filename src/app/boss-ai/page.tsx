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

// 账号密码验证组件
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 管理员账号和密码
    const correctUsername = 'gao-huan'
    const correctPassword = 'Hsta3879'

    if (username === correctUsername && password === correctPassword) {
      onSuccess()
      setError('')
    } else {
      setError('账号或密码错误，请联系管理员')
      setUsername('')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">BOSS AI 内容生成</h2>
            <p className="text-gray-600 mt-2">请输入管理员账号和密码</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 font-medium"
            >
              登录
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ⚡ 安全提示：仅限授权管理员使用
            </p>
          </div>
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

  // 如果未认证，显示登录界面
  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => setIsAuthenticated(true)} />
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
        {/* 管理员信息 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white mr-2">👑</span>
              <span className="font-medium">BOSS AI 内容生成系统 - 管理员: gao-huan</span>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-white hover:text-gray-200 text-sm underline"
            >
              退出登录
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">🤖 BOSS AI 内容生成器</h1>

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
                  <option value="纪录片">🎥 纪录片</option>
                  <option value="软件">💻 软件</option>
                  <option value="书籍">📚 书籍</option>
                  <option value="音乐">🎵 音乐</option>
                  <option value="其他">📦 其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">标签 <span className="text-gray-400">(用逗号分隔)</span></label>
                <input
                  type="text"
                  value={resource.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="例如：科幻, 动作, 冒险"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">资源描述</label>
                <textarea
                  value={resource.description}
                  onChange={(e) => setResource(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述这个资源..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">下载链接 <span className="text-gray-400">(可选)</span></label>
                <input
                  type="url"
                  value={resource.downloadLink}
                  onChange={(e) => setResource(prev => ({ ...prev, downloadLink: e.target.value }))}
                  placeholder="例如：https://pan.baidu.com/xxx"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => generateContent(false)}
                  disabled={isGenerating}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {isGenerating ? '🔄 生成中...' : '✨ 生成内容'}
                </button>
                <button
                  onClick={() => generateContent(true)}
                  disabled={isGenerating || isPublishing}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {isPublishing ? '🚀 发布中...' : '🚀 生成并发布'}
                </button>
              </div>
            </div>
          </div>

          {/* 生成结果 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📄 生成结果</h2>

            {isGenerating && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">AI正在生成内容，请稍候...</p>
              </div>
            )}

            {generatedContent && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">文章标题</h3>
                  <p className="bg-gray-50 p-3 rounded text-lg font-semibold">{generatedContent.title}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">文章摘要</h3>
                  <p className="bg-gray-50 p-3 rounded">{generatedContent.excerpt}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">文章内容</h3>
                  <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent.content}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {publishedPost && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold mb-2">✅ 发布成功！</h3>
                <p className="text-green-700 text-sm">
                  文章已成功发布到网站。
                  <br />
                  <a
                    href={`/posts/${publishedPost.slug}`}
                    className="text-green-600 underline hover:text-green-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看发布的文章 →
                  </a>
                </p>
              </div>
            )}

            {!generatedContent && !isGenerating && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <p>在左侧填写资源信息，然后点击生成内容</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}