'use client'

import { useState, useRef, useEffect } from 'react'

interface ResourceInfo {
  title: string;
  category: string;
  files: string[];
  tags: string[];
  description?: string;
  downloadLink?: string;
}

interface BatchResourceInfo extends ResourceInfo {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'skipped' | 'error';
  result?: GeneratedContent;
  error?: string;
  skippedReason?: string;
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
}

// 安全的密码保护组件 - 使用API验证
function PasswordProtection({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin-token', data.token);
        onSuccess();
      } else {
        setError(data.error || '认证失败')
        setPassword('')
      }
    } catch (error) {
      console.error('认证请求失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
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
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? '🔄 验证中...' : '访问系统'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            🛡️ 服务器端安全验证
          </div>
        </div>
      </div>
    </div>
  )
}

// AI内容生成器主界面 - 增强版
function AIContentGenerator({ onLogout }: { onLogout: () => void }) {
  // 单个资源生成状态
  const [resource, setResource] = useState<ResourceInfo>({
    title: '',
    category: '',
    files: [],
    tags: [],
    description: '',
    downloadLink: ''
  })

  // 批量生成状态
  const [batchResources, setBatchResources] = useState<BatchResourceInfo[]>([])
  const [batchMode, setBatchMode] = useState(false)

  // 生成控制
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedContent | null>(null)

  // 高级设置
  const [contentTemplate, setContentTemplate] = useState<'movieReview' | 'enhanced' | 'safe'>('movieReview')
  const [generateOnly, setGenerateOnly] = useState(false)
  const [autoPublishDelay, setAutoPublishDelay] = useState(0)

  // 批量导入引用
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 单个资源生成
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
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        },
        body: JSON.stringify({
          resource,
          generateOnly,
          template: contentTemplate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setResult(data.content)
        if (!generateOnly) {
          alert('内容生成并发布成功！')
        } else {
          alert('内容生成完成，请检查后手动发布')
        }
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

  // 批量导入CSV
  const handleBatchImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split(/\r?\n/).filter(line => line.trim())

        // 更健壮的 CSV 行解析：支持带引号和逗号的数据
        const parseCSVLine = (text: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else current += char;
          }
          result.push(current.trim());
          return result;
        };

        const resources: BatchResourceInfo[] = lines.slice(1).map((line, index) => {
          const values = parseCSVLine(line);
          return {
            id: `batch-${Date.now()}-${index}`,
            title: values[0] || '',
            category: values[1] || '电影',
            description: values[2] || '',
            downloadLink: values[3] || '',
            files: [],
            tags: values[4] ? values[4].split('|').map(t => t.trim()) : [],
            status: 'pending' as const
          }
        }).filter(r => r.title)

        setBatchResources(resources)
        alert(`成功导入 ${resources.length} 个资源`)
      } catch (error) {
        alert('CSV文件格式错误，请检查格式')
      }
    }
    reader.readAsText(file)
  }

  // 批量生成
  const handleBatchGenerate = async () => {
    if (batchResources.length === 0) {
      alert('请先导入资源列表')
      return
    }

    setIsGenerating(true)

    for (let i = 0; i < batchResources.length; i++) {
      const resource = batchResources[i]
      if (resource.status !== 'pending') continue

      setBatchResources(prev => prev.map(r =>
        r.id === resource.id ? { ...r, status: 'generating' } : r
      ))

      try {
        const response = await fetch('/api/generate-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
          },
          body: JSON.stringify({
            resource: {
              title: resource.title,
              category: resource.category,
              description: resource.description,
              downloadLink: resource.downloadLink,
              files: resource.files,
              tags: resource.tags
            },
            generateOnly,
            template: contentTemplate
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          if (data.skipped) {
            setBatchResources(prev => prev.map(r =>
              r.id === resource.id ? {
                ...r,
                status: 'skipped',
                skippedReason: data.message || '资源已存在'
              } : r
            ))
          } else {
            setBatchResources(prev => prev.map(r =>
              r.id === resource.id ? {
                ...r,
                status: 'completed',
                result: data.content
              } : r
            ))
          }
        } else {
          throw new Error(data.error || '生成失败')
        }

        if (autoPublishDelay > 0 && i < batchResources.length - 1) {
          await new Promise(resolve => setTimeout(resolve, autoPublishDelay * 1000))
        }

      } catch (error) {
        console.error(`批量生成错误 [${resource.title}]:`, error)
        setBatchResources(prev => prev.map(r =>
          r.id === resource.id ? {
            ...r,
            status: 'error',
            error: error instanceof Error ? error.message : '未知错误'
          } : r
        ))
      }
    }

    setIsGenerating(false)
    alert('批量生成完成！')
  }

  const addBatchResource = () => {
    const newResource: BatchResourceInfo = {
      id: `manual-${Date.now()}`,
      title: '',
      category: '',
      description: '',
      downloadLink: '',
      files: [],
      tags: [],
      status: 'pending'
    }
    setBatchResources(prev => [...prev, newResource])
  }

  const removeBatchResource = (id: string) => {
    setBatchResources(prev => prev.filter(r => r.id !== id))
  }

  const updateBatchResource = (id: string, field: string, value: string | string[]) => {
    setBatchResources(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ))
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setResource({ ...resource, tags })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🤖 AI内容生成器</h1>
              <p className="text-gray-600 mt-1">专业的AI驱动内容创作平台 - 仅使用Cohere AI</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBatchMode(false)}
                  className={`px-4 py-2 rounded-lg text-sm ${!batchMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  🎯 单个生成
                </button>
                <button
                  onClick={() => setBatchMode(true)}
                  className={`px-4 py-2 rounded-lg text-sm ${batchMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  📦 批量生成
                </button>
              </div>
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✅ 已认证
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                退出登录
              </button>
            </div>
          </div>

          {/* 高级设置面板 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">内容模板</label>
              <select
                value={contentTemplate}
                onChange={(e) => setContentTemplate(e.target.value as 'movieReview' | 'enhanced' | 'safe')}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="movieReview">🎬 影评风格</option>
                <option value="enhanced">✨ 增强模板</option>
                <option value="safe">🔒 安全模板</option>
              </select>
            </div>
            <div>
              <label className="flex items-center text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={generateOnly}
                  onChange={(e) => setGenerateOnly(e.target.checked)}
                  className="mr-2"
                />
                仅生成预览
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                发布延迟 (秒)
              </label>
              <input
                type="number"
                value={autoPublishDelay}
                onChange={(e) => setAutoPublishDelay(Number(e.target.value))}
                min="0"
                max="300"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {!batchMode ? (
          /* 单个资源生成 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">📝 资源信息</h2>
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
                    placeholder="例如：泰坦尼克号"
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
                    <option value="电影">🎬 电影</option>
                    <option value="软件">💻 软件</option>
                    <option value="游戏">🎮 游戏</option>
                    <option value="音乐">🎵 音乐</option>
                    <option value="教程">📚 教程</option>
                    <option value="其他">📁 其他</option>
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
                    placeholder="例如：爱情,灾难,经典"
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
                    placeholder="https://pan.quark.cn/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    资源描述
                  </label>
                  <textarea
                    value={resource.description}
                    onChange={(e) => setResource({ ...resource, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="详细描述资源内容、特点、使用说明等..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !resource.title.trim()}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {isGenerating ? '🔄 生成中...' : '🚀 生成内容'}
                  </button>
                </div>
              </div>
            </div>

            {/* 生成结果 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">📄 生成结果</h2>
              {result ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标题
                    </label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {result.title}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      摘要
                    </label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {result.excerpt}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标签
                    </label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {result.tags.join(', ')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      内容预览
                    </label>
                    <pre className="p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                      {result.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <p>生成的内容将显示在这里</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 批量生成模式 */
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📦 批量生成</h2>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleBatchImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  📄 导入CSV
                </button>
                <button
                  onClick={addBatchResource}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  ➕ 添加资源
                </button>
                <button
                  onClick={handleBatchGenerate}
                  disabled={isGenerating || batchResources.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {isGenerating ? '🔄 批量生成中...' : '🚀 开始批量生成'}
                </button>
              </div>
            </div>

            {batchResources.length > 0 ? (
              <div className="space-y-4">
                {batchResources.map((resource, index) => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${resource.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                          resource.status === 'generating' ? 'bg-blue-100 text-blue-600' :
                            resource.status === 'completed' ? 'bg-green-100 text-green-600' :
                              resource.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-600'
                          }`}>
                          {
                            resource.status === 'pending' ? '⏳ 等待' :
                              resource.status === 'generating' ? '🔄 生成中' :
                                resource.status === 'completed' ? '✅ 完成' :
                                  resource.status === 'skipped' ? '⏭️ 跳过' :
                                    '❌ 错误'
                          }
                        </span>
                        <button
                          onClick={() => removeBatchResource(resource.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <input
                        type="text"
                        placeholder="标题"
                        value={resource.title}
                        onChange={(e) => updateBatchResource(resource.id, 'title', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        placeholder="分类"
                        value={resource.category}
                        onChange={(e) => updateBatchResource(resource.id, 'category', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        placeholder="描述"
                        value={resource.description}
                        onChange={(e) => updateBatchResource(resource.id, 'description', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        placeholder="网盘链接"
                        value={resource.downloadLink}
                        onChange={(e) => updateBatchResource(resource.id, 'downloadLink', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        placeholder="标签(逗号分隔)"
                        value={resource.tags.join(', ')}
                        onChange={(e) => updateBatchResource(resource.id, 'tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>

                    {resource.status === 'skipped' && (
                      <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                        <strong>已跳过:</strong> {resource.skippedReason || '该资源可能已在近期发布过。'}
                      </div>
                    )}

                    {resource.status === 'error' && resource.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        错误: {resource.error}
                      </div>
                    )}

                    {resource.result && (
                      <div className="mt-2 text-xs bg-green-50 p-2 rounded">
                        <strong>生成完成:</strong> {resource.result.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">📦</div>
                <p>导入CSV文件或手动添加资源开始批量生成</p>
                <p className="text-sm mt-2">CSV格式: 标题,分类,描述,网盘链接,标签(用|分隔)</p>
              </div>
            )}
          </div>
        )}

        {/* 状态统计 */}
        {batchMode && batchResources.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-3">📊 生成统计</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {batchResources.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">等待生成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {batchResources.filter(r => r.status === 'generating').length}
                </div>
                <div className="text-sm text-gray-500">生成中</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {batchResources.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {batchResources.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-500">生成失败</div>
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

  // 检查 localStorage 中是否已有 token
  useEffect(() => {
    const token = localStorage.getItem('admin-token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin-token')
  }

  if (!isAuthenticated) {
    return <PasswordProtection onSuccess={handleLogin} />
  }

  return <AIContentGenerator onLogout={handleLogout} />
}