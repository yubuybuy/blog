'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

export default function AIGeneratorTab() {
  // 单个资源
  const [resource, setResource] = useState<ResourceInfo>({
    title: '', category: '', files: [], tags: [], description: '', downloadLink: ''
  })

  // 批量
  const [batchResources, setBatchResources] = useState<BatchResourceInfo[]>([])
  const [batchMode, setBatchMode] = useState(false)
  const [batchJobId, setBatchJobId] = useState<string | null>(null)

  // 控制
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedContent | null>(null)
  const [aiMethod, setAiMethod] = useState<string>('')
  const [processingTime, setProcessingTime] = useState<number>(0)
  const stopRef = useRef(false)

  // 设置
  const [contentTemplate, setContentTemplate] = useState<'movieReview' | 'enhanced' | 'safe'>('movieReview')
  const [generateOnly, setGenerateOnly] = useState(false)
  const [autoPublishDelay, setAutoPublishDelay] = useState(0)

  // 文件上传
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadInfo, setUploadInfo] = useState<{ totalRows: number; fileName: string } | null>(null)
  const [startRow, setStartRow] = useState(1)
  const [endRow, setEndRow] = useState(0)

  const authHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
  })

  // 页面加载时检查是否有未完成的任务
  useEffect(() => {
    checkExistingJob()
  }, [])

  const checkExistingJob = async () => {
    try {
      const resp = await fetch('/api/batch-jobs', { headers: authHeader() })
      const data = await resp.json()
      if (data.exists && data.job.pending > 0) {
        setBatchMode(true)
        setBatchResources(data.resources)
        setBatchJobId(data.job.id)
        setUploadInfo({ totalRows: data.job.total, fileName: '(已保存的任务)' })
      }
    } catch { /* ignore */ }
  }

  // 保存单个资源状态到服务器
  const saveItemStatus = async (itemId: string, status: string, extra?: Record<string, unknown>) => {
    try {
      await fetch('/api/batch-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ action: 'update-item', itemId, status, ...extra })
      })
    } catch { /* best effort */ }
  }

  // 带重试的生成请求
  const generateWithRetry = async (res: BatchResourceInfo) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({
            resource: {
              title: res.title, category: res.category,
              description: res.description, downloadLink: res.downloadLink,
              files: res.files, tags: res.tags
            },
            generateOnly,
            template: contentTemplate
          })
        })

        if (response.status === 503 && attempt < MAX_RETRIES) {
          console.log(`503 错误，${RETRY_DELAY_MS / 1000}秒后重试 (${attempt}/${MAX_RETRIES}): ${res.title}`)
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
          continue
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        if (attempt === MAX_RETRIES) throw error
        console.log(`请求失败，重试 (${attempt}/${MAX_RETRIES}): ${res.title}`)
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
      }
    }
    throw new Error('重试次数已用完')
  }

  // 单个资源生成
  const handleGenerate = async () => {
    if (!resource.title.trim()) { alert('请输入资源标题'); return }
    setIsGenerating(true); setResult(null)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ resource, generateOnly, template: contentTemplate })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        if (data.skipped) {
          alert(`⏭️ 该资源已发布过，已自动跳过。`)
          return
        }
        setResult(data.content); setAiMethod(data.method || 'unknown'); setProcessingTime(data.processingTime || 0)
        const aiName = data.method === 'gemini' ? 'Google Gemini' : data.method === 'cohere' ? 'Cohere AI' : 'AI'
        alert(generateOnly
          ? `✅ 内容生成完成！\n🤖 ${aiName}\n⏱️ ${data.processingTime || 0}ms\n\n请检查后手动发布`
          : `✅ 内容生成并发布成功！\n🤖 ${aiName}\n⏱️ ${data.processingTime || 0}ms`)
      } else throw new Error(data.error || '生成失败')
    } catch (error) {
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally { setIsGenerating(false) }
  }

  // 手动发布预览内容
  const handleManualPublish = async () => {
    if (!result) { alert('没有可发布的内容'); return }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ resource, generateOnly: false, template: contentTemplate, publishPregenerated: true, content: result })
      })
      if (!response.ok) throw new Error((await response.json()).error || `HTTP error`)
      const data = await response.json()
      if (data.success) { alert('✅ 内容发布成功！'); setResult(null); setResource({ title: '', category: '', files: [], tags: [], description: '', downloadLink: '' }) }
      else throw new Error(data.error || '发布失败')
    } catch (error) { alert(`发布失败: ${error instanceof Error ? error.message : '未知错误'}`) }
    finally { setIsGenerating(false) }
  }

  // 文件上传（CSV / Excel）
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('startRow', String(startRow))
    formData.append('endRow', String(endRow))

    try {
      const resp = await fetch('/api/batch-jobs/upload', {
        method: 'POST',
        headers: authHeader(),
        body: formData,
      })
      const data = await resp.json()
      if (data.success) {
        setBatchResources(data.resources)
        setUploadInfo({ totalRows: data.totalRows, fileName: file.name })
        alert(`成功解析 ${data.resources.length} 条资源（共 ${data.totalRows} 行，选择第 ${data.selectedRange.start}-${data.selectedRange.end} 行）`)
      } else {
        alert(`解析失败: ${data.error}`)
      }
    } catch (error) {
      alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    // 重置 file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 重新解析（更换行范围后）
  const handleReparse = () => {
    fileInputRef.current?.click()
  }

  // 批量生成
  const handleBatchGenerate = useCallback(async () => {
    const pending = batchResources.filter(r => r.status === 'pending')
    if (pending.length === 0) { alert('没有待处理的资源'); return }

    stopRef.current = false
    setIsGenerating(true)

    // 保存任务到服务器
    try {
      await fetch('/api/batch-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          action: 'create',
          settings: { generateOnly, contentTemplate, autoPublishDelay },
          resources: batchResources,
        })
      })
    } catch { /* best effort */ }

    for (let i = 0; i < batchResources.length; i++) {
      if (stopRef.current) break

      const res = batchResources[i]
      if (res.status !== 'pending') continue

      // 标记为生成中
      setBatchResources(prev => prev.map(r => r.id === res.id ? { ...r, status: 'generating' } : r))

      try {
        const data = await generateWithRetry(res)

        if (data.success) {
          if (data.skipped) {
            setBatchResources(prev => prev.map(r =>
              r.id === res.id ? { ...r, status: 'skipped', skippedReason: data.message || '已存在' } : r
            ))
            await saveItemStatus(res.id, 'skipped', { skippedReason: data.message })
          } else {
            setBatchResources(prev => prev.map(r =>
              r.id === res.id ? { ...r, status: 'completed', result: data.content } : r
            ))
            await saveItemStatus(res.id, 'completed', { result: data.content })
          }
        } else {
          throw new Error(data.error || '生成失败')
        }

        // 延迟
        if (autoPublishDelay > 0 && i < batchResources.length - 1) {
          await new Promise(r => setTimeout(r, autoPublishDelay * 1000))
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        setBatchResources(prev => prev.map(r =>
          r.id === res.id ? { ...r, status: 'error', error: errMsg } : r
        ))
        await saveItemStatus(res.id, 'error', { error: errMsg })
      }
    }

    setIsGenerating(false)
    if (!stopRef.current) alert('批量生成完成！')
  }, [batchResources, generateOnly, contentTemplate, autoPublishDelay])

  const handleStop = () => { stopRef.current = true }

  // 重试失败项
  const handleRetryErrors = () => {
    setBatchResources(prev => prev.map(r =>
      r.status === 'error' ? { ...r, status: 'pending', error: undefined } : r
    ))
  }

  // 清除任务
  const handleClearJob = async () => {
    setBatchResources([])
    setBatchJobId(null)
    setUploadInfo(null)
    try {
      await fetch('/api/batch-jobs', { method: 'DELETE', headers: authHeader() })
    } catch { /* ignore */ }
  }

  const handleTagsChange = (value: string) => {
    setResource({ ...resource, tags: value.split(',').map(t => t.trim()).filter(Boolean) })
  }

  // 统计
  const stats = {
    pending: batchResources.filter(r => r.status === 'pending').length,
    generating: batchResources.filter(r => r.status === 'generating').length,
    completed: batchResources.filter(r => r.status === 'completed').length,
    skipped: batchResources.filter(r => r.status === 'skipped').length,
    error: batchResources.filter(r => r.status === 'error').length,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🤖 AI内容生成器</h2>
            <p className="text-gray-600 mt-1">Gemini + Cohere · 支持 Excel/CSV 批量导入 · 断点续传</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBatchMode(false)}
              className={`px-4 py-2 rounded-lg text-sm ${!batchMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              🎯 单个生成
            </button>
            <button onClick={() => setBatchMode(true)}
              className={`px-4 py-2 rounded-lg text-sm ${batchMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              📦 批量生成
            </button>
          </div>
        </div>

        {/* 设置面板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">内容模板</label>
            <select value={contentTemplate} onChange={(e) => setContentTemplate(e.target.value as 'movieReview' | 'enhanced' | 'safe')}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500">
              <option value="movieReview">🎬 影评风格</option>
              <option value="enhanced">✨ 增强模板</option>
              <option value="safe">🔒 安全模板</option>
            </select>
          </div>
          <div>
            <label className="flex items-center text-xs font-medium text-gray-700 mt-4">
              <input type="checkbox" checked={generateOnly} onChange={(e) => setGenerateOnly(e.target.checked)} className="mr-2" />
              仅生成预览（不自动发布）
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">发布间隔 (秒)</label>
            <input type="number" value={autoPublishDelay} onChange={(e) => setAutoPublishDelay(Number(e.target.value))}
              min="0" max="300" className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {!batchMode ? (
        /* ========== 单个资源生成 ========== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">📝 资源信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">资源标题 *</label>
                <input type="text" value={resource.title} onChange={(e) => setResource({ ...resource, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="例如：泰坦尼克号" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select value={resource.category} onChange={(e) => setResource({ ...resource, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">标签 (逗号分隔)</label>
                <input type="text" value={resource.tags.join(', ')} onChange={(e) => handleTagsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="例如：爱情,灾难,经典" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">网盘链接</label>
                <input type="url" value={resource.downloadLink} onChange={(e) => setResource({ ...resource, downloadLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="https://pan.quark.cn/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">资源描述</label>
                <textarea value={resource.description} onChange={(e) => setResource({ ...resource, description: e.target.value })}
                  rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="详细描述..." />
              </div>
              <div className="pt-4">
                <button onClick={handleGenerate} disabled={isGenerating || !resource.title.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium">
                  {isGenerating ? '🔄 生成中...' : '🚀 生成内容'}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">📄 生成结果</h3>
            {result ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-green-800">🤖 {aiMethod === 'gemini' ? 'Gemini' : aiMethod === 'cohere' ? 'Cohere' : 'AI'}</span>
                    <span className="text-green-700">⏱️ {processingTime}ms</span>
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">标题</label><div className="p-2 bg-gray-50 rounded text-sm">{result.title}</div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">摘要</label><div className="p-2 bg-gray-50 rounded text-sm">{result.excerpt}</div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">标签</label><div className="p-2 bg-gray-50 rounded text-sm">{result.tags.join(', ')}</div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">内容预览</label>
                  <pre className="p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">{result.content}</pre>
                </div>
                {generateOnly && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div><h4 className="text-sm font-medium text-blue-800">📝 预览完成</h4><p className="text-xs text-blue-600">检查后手动发布</p></div>
                    <button onClick={handleManualPublish} disabled={isGenerating}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{isGenerating ? '🔄 发布中...' : '📤 立即发布'}</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12"><div className="text-4xl mb-4">📝</div><p>生成的内容将显示在这里</p></div>
            )}
          </div>
        </div>
      ) : (
        /* ========== 批量生成模式 ========== */
        <div className="space-y-6">
          {/* 导入面板 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">📦 批量导入与生成</h3>

            {/* 文件上传 + 行范围 */}
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">起始行</label>
                <input type="number" value={startRow} onChange={(e) => setStartRow(Math.max(1, Number(e.target.value)))}
                  min="1" className="w-24 px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">结束行 (0=全部)</label>
                <input type="number" value={endRow} onChange={(e) => setEndRow(Math.max(0, Number(e.target.value)))}
                  min="0" className="w-24 px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>

              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                📂 导入文件 (Excel/CSV)
              </button>

              {uploadInfo && (
                <span className="text-xs text-gray-500">
                  {uploadInfo.fileName} · 共 {uploadInfo.totalRows} 行
                </span>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2">
              {!isGenerating ? (
                <button onClick={handleBatchGenerate} disabled={batchResources.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-400">
                  🚀 开始批量生成 ({stats.pending} 待处理)
                </button>
              ) : (
                <button onClick={handleStop}
                  className="px-6 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                  ⏹️ 停止生成
                </button>
              )}

              {stats.error > 0 && !isGenerating && (
                <button onClick={handleRetryErrors}
                  className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600">
                  🔄 重试失败项 ({stats.error})
                </button>
              )}

              {batchResources.length > 0 && !isGenerating && (
                <button onClick={handleClearJob}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600">
                  🗑️ 清除任务
                </button>
              )}
            </div>
          </div>

          {/* 统计面板 */}
          {batchResources.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-5 gap-4 text-center">
                <div><div className="text-2xl font-bold text-gray-600">{stats.pending}</div><div className="text-sm text-gray-500">等待</div></div>
                <div><div className="text-2xl font-bold text-blue-600">{stats.generating}</div><div className="text-sm text-gray-500">生成中</div></div>
                <div><div className="text-2xl font-bold text-green-600">{stats.completed}</div><div className="text-sm text-gray-500">完成</div></div>
                <div><div className="text-2xl font-bold text-yellow-600">{stats.skipped}</div><div className="text-sm text-gray-500">跳过</div></div>
                <div><div className="text-2xl font-bold text-red-600">{stats.error}</div><div className="text-sm text-gray-500">失败</div></div>
              </div>
              {isGenerating && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((stats.completed + stats.skipped + stats.error) / batchResources.length) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {stats.completed + stats.skipped + stats.error} / {batchResources.length} · 503 自动重试 (最多 {MAX_RETRIES} 次)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 资源列表 */}
          {batchResources.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">资源列表 ({batchResources.length})</h4>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {batchResources.map((res, index) => (
                  <div key={res.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    res.status === 'completed' ? 'border-green-200 bg-green-50' :
                    res.status === 'error' ? 'border-red-200 bg-red-50' :
                    res.status === 'generating' ? 'border-blue-200 bg-blue-50' :
                    res.status === 'skipped' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200'
                  }`}>
                    <span className="text-xs text-gray-400 w-8">#{index + 1}</span>
                    <span className="flex-1 text-sm font-medium truncate">{res.title}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{res.downloadLink}</span>
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      res.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                      res.status === 'generating' ? 'bg-blue-100 text-blue-600' :
                      res.status === 'completed' ? 'bg-green-100 text-green-600' :
                      res.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {res.status === 'pending' ? '⏳ 等待' :
                       res.status === 'generating' ? '🔄 生成中' :
                       res.status === 'completed' ? '✅ 完成' :
                       res.status === 'skipped' ? '⏭️ 跳过' :
                       '❌ 失败'}
                    </span>
                    {res.error && <span className="text-xs text-red-500 truncate max-w-[200px]" title={res.error}>{res.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">📂</div>
              <p className="font-medium">导入 Excel 或 CSV 文件开始批量生成</p>
              <p className="text-sm mt-2">支持 .xlsx / .xls / .csv 格式</p>
              <p className="text-sm mt-1">表头列顺序: 标题, 分类, 描述, 网盘链接, 标签</p>
              <p className="text-sm mt-1 text-blue-500">可设置起始行/结束行来选择部分数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
