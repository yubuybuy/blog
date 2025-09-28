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
              onChange={(e) => setContentTemplate(e.target.value as any)}
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
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">批量生成功能</h3>
            <p className="text-gray-500">批量生成功能正在开发中...</p>
          </div>
        </div>
      )}
    </div>
  )
}