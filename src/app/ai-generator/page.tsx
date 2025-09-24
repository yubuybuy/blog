'use client'

import { useState } from 'react'

interface ResourceInfo {
  title: string;
  category: string;
  files: string[];
  tags: string[];
  description?: string;
  downloadLink?: string; // 新增网盘链接字段
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
}

export default function AIContentGenerator() {
  const [resource, setResource] = useState<ResourceInfo>({
    title: '',
    category: '电影',
    files: [],
    tags: [],
    description: '',
    downloadLink: '' // 初始化网盘链接
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState<string>('')
  const [publishedPost, setPublishedPost] = useState<any>(null)

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

      if (!response.ok) {
        throw new Error(data.error || '生成失败')
      }

      setGeneratedContent(data.content)

      if (data.published) {
        setPublishedPost(data.published)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setIsGenerating(false)
      setIsPublishing(false)
    }
  }

  const publishContent = async () => {
    if (!generatedContent) {
      setError('请先生成内容')
      return
    }

    setIsPublishing(true)
    setError('')

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource,
          generateOnly: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '发布失败')
      }

      setPublishedPost(data.published)

    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI 内容生成器</h1>
        <p className="text-gray-600">使用AI自动生成博客文章内容，支持Gemini和Cohere API</p>
        <div className="mt-2 text-sm text-blue-600">
          ✨ 在Vercel服务器上运行，无需本地代理配置！
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 输入表单 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📝 资源信息</h2>
          <p className="text-gray-600 text-sm mb-6">填写资源基本信息，AI会据此生成文章</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">资源标题 *</label>
              <input
                type="text"
                value={resource.title}
                onChange={(e) => setResource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例如：精选科幻影视合集"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <option value="软件">💻 软件</option>
                <option value="教育">📚 教育</option>
                <option value="音乐">🎵 音乐</option>
                <option value="游戏">🎮 游戏</option>
                <option value="其他">📦 其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">标签</label>
              <input
                type="text"
                value={resource.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="例如：科幻, 高清, 推荐 (用逗号分隔)"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
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
                {isGenerating ? '📤 发布中...' : '🚀 生成并发布'}
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
          <p className="text-gray-600 text-sm mb-6">AI生成的文章内容预览</p>

          {generatedContent ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{generatedContent.title}</h3>
                <p className="text-gray-600 text-sm mb-3 bg-gray-50 p-3 rounded-md">{generatedContent.excerpt}</p>
                <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-1">
                  🏷️ {generatedContent.tags.map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-md text-sm max-h-80 overflow-y-auto border">
                  <div className="whitespace-pre-wrap font-mono text-xs">{generatedContent.content}</div>
                </div>
              </div>

              {!publishedPost && (
                <button
                  onClick={publishContent}
                  disabled={isPublishing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isPublishing ? '📤 发布中...' : '🚀 发布到博客'}
                </button>
              )}

              {publishedPost && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                  <div className="text-green-800 font-medium">✅ 发布成功！</div>
                  <div className="text-green-600 text-sm">
                    文章ID: {publishedPost._id}
                  </div>
                  <div className="text-green-600 text-sm">
                    可以在你的博客网站上查看新文章了！
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-4xl mb-4">🤖</div>
              <div>填写资源信息后点击"预览生成"来生成内容</div>
            </div>
          )}
        </div>
      </div>

      {/* API状态检查 */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">🔧 系统状态</h2>
        <APIStatus />
      </div>
    </div>
  )
}

function APIStatus() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-content')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('状态检查失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={checkStatus}
        disabled={loading}
        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {loading ? '🔄 检查中...' : '🔍 检查API状态'}
      </button>

      {status && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Gemini API:</span>
              <span className={status.apis.gemini ? 'text-green-600' : 'text-red-600'}>
                {status.apis.gemini ? '✅ 已配置' : '❌ 未配置'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Cohere API:</span>
              <span className={status.apis.cohere ? 'text-green-600' : 'text-red-600'}>
                {status.apis.cohere ? '✅ 已配置' : '❌ 未配置'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Sanity:</span>
              <span className={status.apis.sanity ? 'text-green-600' : 'text-red-600'}>
                {status.apis.sanity ? '✅ 已配置' : '❌ 未配置'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
            <div>状态: {status.status}</div>
            <div>时间: {new Date(status.timestamp).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}