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
  platformContent?: {
    zhihu?: string;
    wechat?: string;
    xiaohongshu?: string;
    toutiao?: string;
  };
}

interface JobStatus {
  id: string;
  stopped: boolean;
  processing: boolean;
  total: number;
  pending: number;
  completed: number;
  error: number;
  skipped: number;
}

const POLL_INTERVAL = 5000;

const PLATFORM_LABELS: Record<string, string> = {
  zhihu: '知乎',
  wechat: '微信公众号',
  xiaohongshu: '小红书',
  toutiao: '百家号/头条',
}

function PlatformContentPanel({ platformContent }: { platformContent: NonNullable<GeneratedContent['platformContent']> }) {
  const [expanded, setExpanded] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      alert('复制失败，请手动选择复制')
    }
  }

  const platforms = (['zhihu', 'wechat', 'xiaohongshu', 'toutiao'] as const).filter(
    k => platformContent[k]
  )

  if (platforms.length === 0) return null

  return (
    <div className="border-t pt-4 mt-4">
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 w-full text-left">
        <span>{expanded ? '▼' : '▶'}</span>
        <span>多平台内容版本 ({platforms.length})</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-4">
          {platforms.map(key => (
            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                <span className="text-xs font-medium text-gray-600">{PLATFORM_LABELS[key]}</span>
                <button
                  onClick={() => handleCopy(key, platformContent[key]!)}
                  className={`text-xs px-2 py-1 rounded ${
                    copiedKey === key ? 'bg-green-100 text-green-700' : 'text-blue-600 hover:bg-blue-50'
                  }`}>
                  {copiedKey === key ? '已复制' : '复制'}
                </button>
              </div>
              <pre className="p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap bg-white">
                {platformContent[key]}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIGeneratorTab() {
  // 单个资源
  const [resource, setResource] = useState<ResourceInfo>({
    title: '', category: '', files: [], tags: [], description: '', downloadLink: ''
  })

  // 批量
  const [batchResources, setBatchResources] = useState<BatchResourceInfo[]>([])
  const [batchMode, setBatchMode] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [serverProcessing, setServerProcessing] = useState(false)

  // 单个生成控制
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedContent | null>(null)
  const [aiMethod, setAiMethod] = useState<string>('')
  const [processingTime, setProcessingTime] = useState<number>(0)

  // 设置
  const [contentTemplate, setContentTemplate] = useState<'movieReview' | 'enhanced' | 'safe'>('movieReview')
  const [generateOnly, setGenerateOnly] = useState(false)
  const [autoPublishDelay, setAutoPublishDelay] = useState(0)
  const [enableMultiPlatform, setEnableMultiPlatform] = useState(false)

  // 文件上传
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadInfo, setUploadInfo] = useState<{ totalRows: number; fileName: string } | null>(null)
  const [startRow, setStartRow] = useState(1)
  const [endRow, setEndRow] = useState(0)

  // 轮询定时器
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const authHeader = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
  }), [])

  // 页面加载时检查是否有未完成的任务
  useEffect(() => {
    checkExistingJob()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const checkExistingJob = async () => {
    try {
      const resp = await fetch('/api/batch-jobs', { headers: authHeader() })
      const data = await resp.json()
      if (data.exists) {
        setBatchMode(true)
        setBatchResources(data.resources)
        setJobStatus(data.job)
        setUploadInfo({ totalRows: data.job.total, fileName: '(已保存的任务)' })
        // 如果服务端正在处理，开始轮询
        if (data.job.processing && !data.job.stopped) {
          setServerProcessing(true)
          startPolling()
        }
      }
    } catch { /* ignore */ }
  }

  // 轮询服务端任务进度 + 触发处理
  const triggerRef = useRef(false) // 防止并发触发
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const resp = await fetch('/api/batch-jobs', { headers: authHeader() })
        const data = await resp.json()
        if (data.exists) {
          setBatchResources(data.resources)
          setJobStatus(data.job)
          if (data.job.pending === 0 || data.job.stopped) {
            // 完成或停止
            setServerProcessing(false)
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          } else if (!data.job.processing && data.job.pending > 0 && !data.job.stopped && !triggerRef.current) {
            // 服务端没在跑但还有待处理项 → 触发处理
            triggerRef.current = true
            fetch('/api/batch-jobs/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeader() },
            }).then(() => { triggerRef.current = false })
              .catch(() => { triggerRef.current = false })
          }
        } else {
          setServerProcessing(false)
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }
      } catch { /* ignore polling errors */ }
    }, POLL_INTERVAL)
  }, [authHeader])

  // 单个资源生成
  const handleGenerate = async () => {
    if (!resource.title.trim()) { alert('请输入资源标题'); return }
    setIsGenerating(true); setResult(null)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ resource, generateOnly, template: contentTemplate, enableMultiPlatform })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        if (data.skipped) {
          alert('该资源已发布过，已自动跳过。')
          return
        }
        setResult(data.content); setAiMethod(data.method || 'unknown'); setProcessingTime(data.processingTime || 0)
        const aiName = data.method === 'gemini' ? 'Google Gemini' : data.method === 'cohere' ? 'Cohere AI' : 'AI'
        alert(generateOnly
          ? `内容生成完成！\n${aiName}\n${data.processingTime || 0}ms\n\n请检查后手动发布`
          : `内容生成并发布成功！\n${aiName}\n${data.processingTime || 0}ms`)
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
      if (!response.ok) throw new Error((await response.json()).error || 'HTTP error')
      const data = await response.json()
      if (data.success) { alert('内容发布成功！'); setResult(null); setResource({ title: '', category: '', files: [], tags: [], description: '', downloadLink: '' }) }
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
        setJobStatus(null)
        alert(`成功解析 ${data.resources.length} 条资源（共 ${data.totalRows} 行，选择第 ${data.selectedRange.start}-${data.selectedRange.end} 行）`)
      } else {
        alert(`解析失败: ${data.error}`)
      }
    } catch (error) {
      alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 开始服务端批量生成
  const handleStartServerProcessing = async () => {
    const pending = batchResources.filter(r => r.status === 'pending')
    if (pending.length === 0) { alert('没有待处理的资源'); return }

    try {
      // 1. 创建/保存任务到服务器（包含 auth token）
      await fetch('/api/batch-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          action: 'create',
          settings: { generateOnly, contentTemplate, autoPublishDelay, enableMultiPlatform },
          resources: batchResources,
        })
      })

      // 2. 触发服务端处理
      setServerProcessing(true)
      fetch('/api/batch-jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      }).catch(() => {})

      // 3. 开始轮询进度
      startPolling()
    } catch (error) {
      alert(`启动失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setServerProcessing(false)
    }
  }

  // 恢复处理（重新打开页面后）
  const handleResume = async () => {
    try {
      // 更新 token 并取消停止状态
      await fetch('/api/batch-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ action: 'resume' })
      })

      setServerProcessing(true)

      // 触发服务端处理
      fetch('/api/batch-jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      }).catch(() => {})

      startPolling()
    } catch (error) {
      alert(`恢复失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 停止处理
  const handleStop = async () => {
    try {
      await fetch('/api/batch-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ action: 'stop' })
      })
      setServerProcessing(false)
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      // 刷新一次状态
      const resp = await fetch('/api/batch-jobs', { headers: authHeader() })
      const data = await resp.json()
      if (data.exists) { setBatchResources(data.resources); setJobStatus(data.job) }
    } catch (error) {
      alert(`停止失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 重试失败项
  const handleRetryErrors = async () => {
    try {
      const resp = await fetch('/api/batch-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ action: 'retry-errors' })
      })
      const data = await resp.json()
      if (data.success) {
        alert(`已重置 ${data.resetCount} 个失败项`)
        // 刷新状态
        const statusResp = await fetch('/api/batch-jobs', { headers: authHeader() })
        const statusData = await statusResp.json()
        if (statusData.exists) { setBatchResources(statusData.resources); setJobStatus(statusData.job) }
      }
    } catch { /* ignore */ }
  }

  // 清除任务
  const handleClearJob = async () => {
    if (serverProcessing) {
      if (!confirm('服务端正在处理中，确定要清除任务吗？')) return
      await handleStop()
    }
    setBatchResources([])
    setJobStatus(null)
    setUploadInfo(null)
    setServerProcessing(false)
    try {
      await fetch('/api/batch-jobs', { method: 'DELETE', headers: authHeader() })
    } catch { /* ignore */ }
  }

  const handleTagsChange = (value: string) => {
    setResource({ ...resource, tags: value.split(',').map(t => t.trim()).filter(Boolean) })
  }

  // 统计
  const stats = jobStatus ? {
    pending: jobStatus.pending,
    generating: batchResources.filter(r => r.status === 'generating').length,
    completed: jobStatus.completed,
    skipped: jobStatus.skipped,
    error: jobStatus.error,
    total: jobStatus.total,
  } : {
    pending: batchResources.filter(r => r.status === 'pending').length,
    generating: batchResources.filter(r => r.status === 'generating').length,
    completed: batchResources.filter(r => r.status === 'completed').length,
    skipped: batchResources.filter(r => r.status === 'skipped').length,
    error: batchResources.filter(r => r.status === 'error').length,
    total: batchResources.length,
  }

  const hasPending = stats.pending > 0
  const hasJob = batchResources.length > 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">AI内容生成器</h2>
            <p className="text-gray-600 mt-1">Gemini + Cohere · Excel/CSV 批量导入 · 服务端后台处理</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBatchMode(false)}
              className={`px-4 py-2 rounded-lg text-sm ${!batchMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              单个生成
            </button>
            <button onClick={() => setBatchMode(true)}
              className={`px-4 py-2 rounded-lg text-sm ${batchMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              批量生成 {hasJob && stats.pending > 0 ? `(${stats.pending})` : ''}
            </button>
          </div>
        </div>

        {/* 设置面板 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">内容模板</label>
            <select value={contentTemplate} onChange={(e) => setContentTemplate(e.target.value as 'movieReview' | 'enhanced' | 'safe')}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500">
              <option value="movieReview">影评风格</option>
              <option value="enhanced">增强模板</option>
              <option value="safe">安全模板</option>
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
          <div>
            <label className="flex items-center text-xs font-medium text-gray-700 mt-4">
              <input type="checkbox" checked={enableMultiPlatform} onChange={(e) => setEnableMultiPlatform(e.target.checked)} className="mr-2" />
              生成多平台内容
            </label>
            <p className="text-xs text-gray-400 mt-1">知乎/公众号/小红书/头条，token消耗约x2</p>
          </div>
        </div>
      </div>

      {!batchMode ? (
        /* ========== 单个资源生成 ========== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">资源信息</h3>
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
                  <option value="电影">电影</option>
                  <option value="软件">软件</option>
                  <option value="游戏">游戏</option>
                  <option value="音乐">音乐</option>
                  <option value="教程">教程</option>
                  <option value="其他">其他</option>
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
                  {isGenerating ? '生成中...' : '生成内容'}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">生成结果</h3>
            {result ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-green-800">{aiMethod === 'gemini' ? 'Gemini' : aiMethod === 'cohere' ? 'Cohere' : 'AI'}</span>
                    <span className="text-green-700">{processingTime}ms</span>
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
                    <div><h4 className="text-sm font-medium text-blue-800">预览完成</h4><p className="text-xs text-blue-600">检查后手动发布</p></div>
                    <button onClick={handleManualPublish} disabled={isGenerating}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{isGenerating ? '发布中...' : '立即发布'}</button>
                  </div>
                )}
                {result.platformContent && (
                  <PlatformContentPanel platformContent={result.platformContent} />
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
          {/* 服务端处理状态提示 */}
          {serverProcessing && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-green-800">服务端正在后台处理中</h4>
                <p className="text-xs text-green-700 mt-1">
                  你可以安全地关闭这个页面，处理不会中断。每 {POLL_INTERVAL / 1000} 秒自动刷新进度。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-green-700 font-medium">运行中</span>
              </div>
            </div>
          )}

          {/* 已有任务恢复提示 */}
          {hasJob && !serverProcessing && hasPending && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-yellow-800">发现未完成的任务</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  {stats.completed + stats.skipped} 已完成，{stats.pending} 待处理，{stats.error} 失败
                </p>
              </div>
              <button onClick={handleResume}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
                继续处理
              </button>
            </div>
          )}

          {/* 导入面板 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">批量导入与生成</h3>

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
              <button onClick={() => fileInputRef.current?.click()} disabled={serverProcessing}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400">
                导入文件 (Excel/CSV)
              </button>

              {uploadInfo && (
                <span className="text-xs text-gray-500">
                  {uploadInfo.fileName} · 共 {uploadInfo.totalRows} 行
                </span>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2">
              {!serverProcessing ? (
                <button onClick={handleStartServerProcessing} disabled={!hasPending}
                  className="px-6 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-400">
                  开始后台生成 ({stats.pending} 待处理)
                </button>
              ) : (
                <button onClick={handleStop}
                  className="px-6 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                  停止生成
                </button>
              )}

              {stats.error > 0 && !serverProcessing && (
                <button onClick={handleRetryErrors}
                  className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600">
                  重试失败项 ({stats.error})
                </button>
              )}

              {hasJob && !serverProcessing && (
                <button onClick={handleClearJob}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600">
                  清除任务
                </button>
              )}
            </div>
          </div>

          {/* 统计面板 + 进度条 */}
          {hasJob && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-5 gap-4 text-center">
                <div><div className="text-2xl font-bold text-gray-600">{stats.pending}</div><div className="text-sm text-gray-500">等待</div></div>
                <div><div className="text-2xl font-bold text-blue-600">{stats.generating}</div><div className="text-sm text-gray-500">生成中</div></div>
                <div><div className="text-2xl font-bold text-green-600">{stats.completed}</div><div className="text-sm text-gray-500">完成</div></div>
                <div><div className="text-2xl font-bold text-yellow-600">{stats.skipped}</div><div className="text-sm text-gray-500">跳过</div></div>
                <div><div className="text-2xl font-bold text-red-600">{stats.error}</div><div className="text-sm text-gray-500">失败</div></div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? ((stats.completed + stats.skipped + stats.error) / stats.total) * 100 : 0}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {stats.completed + stats.skipped + stats.error} / {stats.total}
                  {serverProcessing && ' · 服务端处理中，可安全关闭页面'}
                </p>
              </div>
            </div>
          )}

          {/* 资源列表 */}
          {hasJob ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">资源列表 ({stats.total})</h4>
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
                      {res.status === 'pending' ? '等待' :
                       res.status === 'generating' ? '生成中' :
                       res.status === 'completed' ? '完成' :
                       res.status === 'skipped' ? '跳过' :
                       '失败'}
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
              <p className="text-sm mt-2 text-green-600 font-medium">处理在服务端运行，关闭浏览器也不会中断</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
