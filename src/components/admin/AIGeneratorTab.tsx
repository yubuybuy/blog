'use client'

import { useState, useRef } from 'react'

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
  status: 'pending' | 'generating' | 'completed' | 'error';
  result?: GeneratedContent;
  error?: string;
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  imagePrompt: string;
}

export default function AIGeneratorTab() {
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
  const [aiMethod, setAiMethod] = useState<string>('')
  const [processingTime, setProcessingTime] = useState<number>(0)

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
        setAiMethod(data.method || 'unknown')
        setProcessingTime(data.processingTime || 0)

        const aiName = data.method === 'gemini' ? 'Google Gemini' :
                      data.method === 'cohere' ? 'Cohere AI' : 'AI'

        if (!generateOnly) {
          alert(`✅ 内容生成并发布成功！\n🤖 AI服务: ${aiName}\n⏱️ 耗时: ${data.processingTime || 0}ms`)
        } else {
          alert(`✅ 内容生成完成！\n🤖 AI服务: ${aiName}\n⏱️ 耗时: ${data.processingTime || 0}ms\n\n请检查后手动发布`)
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

  // 手动发布预览内容
  const handleManualPublish = async () => {
    if (!result) {
      alert('没有可发布的内容')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource,
          generateOnly: false, // 设置为发布模式
          template: contentTemplate,
          publishPregenerated: true, // 标记这是发布预生成的内容
          content: result // 传递已生成的内容
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const aiName = aiMethod === 'gemini' ? 'Google Gemini' :
                      aiMethod === 'cohere' ? 'Cohere AI' : 'AI'

        alert(`✅ 内容发布成功！\n🤖 AI服务: ${aiName}\n📝 文章已上线`)

        // 清空表单，准备下一次生成
        setResult(null)
        setResource({
          title: '',
          category: '',
          files: [],
          tags: [],
          description: '',
          downloadLink: ''
        })
      } else {
        throw new Error(data.error || '发布失败')
      }
    } catch (error) {
      console.error('发布错误:', error)
      alert(`发布失败: ${error instanceof Error ? error.message : '未知错误'}`)
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
        const lines = text.split('\n').filter(line => line.trim())

        const resources: BatchResourceInfo[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim())
          return {
            id: `batch-${Date.now()}-${index}`,
            title: values[0] || '',
            category: values[1] || '',
            description: values[2] || '',
            downloadLink: values[3] || '',
            files: [],
            tags: values[4] ? values[4].split('|') : [],
            status: 'pending' as const
          }
        }).filter(r => r.title)

        setBatchResources(resources)
        alert(`成功导入 ${resources.length} 个资源`)
      } catch {
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
          setBatchResources(prev => prev.map(r =>
            r.id === resource.id ? {
              ...r,
              status: 'completed',
              result: data.content
            } : r
          ))
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
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🤖 AI内容生成器</h2>
            <p className="text-gray-600 mt-1">专业的AI驱动内容创作平台 - Gemini + Cohere</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchMode(false)}
              className={`px-4 py-2 rounded-lg text-sm ${
                !batchMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎯 单个生成
            </button>
            <button
              onClick={() => setBatchMode(true)}
              className={`px-4 py-2 rounded-lg text-sm ${
                batchMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📦 批量生成
            </button>
          </div>
        </div>

        {/* 高级设置面板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
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
            <h3 className="text-lg font-semibold mb-4">📝 资源信息</h3>
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
            <h3 className="text-lg font-semibold mb-4">📄 生成结果</h3>
            {result ? (
              <div className="space-y-4">
                {/* AI信息面板 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-green-800">
                        🤖 AI服务: {aiMethod === 'gemini' ? 'Google Gemini' :
                                   aiMethod === 'cohere' ? 'Cohere AI' : 'Unknown AI'}
                      </span>
                      <span className="text-green-700">
                        ⏱️ 耗时: {processingTime}ms
                      </span>
                    </div>
                    <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
                      ✅ 生成成功
                    </span>
                  </div>
                </div>

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

                {/* 手动发布按钮 - 仅在预览模式下显示 */}
                {generateOnly && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1">📝 内容预览完成</h4>
                        <p className="text-xs text-blue-600">内容已生成，请检查后手动发布到网站</p>
                      </div>
                      <button
                        onClick={handleManualPublish}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isGenerating ? '🔄 发布中...' : '📤 立即发布'}
                      </button>
                    </div>
                  </div>
                )}
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
            <h3 className="text-lg font-semibold">📦 批量生成</h3>
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resource.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                        resource.status === 'generating' ? 'bg-blue-100 text-blue-600' :
                        resource.status === 'completed' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {
                          resource.status === 'pending' ? '⏳ 等待' :
                          resource.status === 'generating' ? '🔄 生成中' :
                          resource.status === 'completed' ? '✅ 完成' :
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
          <h4 className="text-lg font-semibold mb-3">📊 生成统计</h4>
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
  )
}