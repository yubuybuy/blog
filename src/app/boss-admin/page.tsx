'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import RecycleBinTab from '@/components/admin/RecycleBinTab'
import AIGeneratorTab from '@/components/admin/AIGeneratorTab'
import SanityStudioTab from '@/components/admin/SanityStudioTab'
import PostManagementTab from '@/components/admin/PostManagementTab'
import DailyRecommendation from '@/components/admin/DailyRecommendation'

// 密码保护组件
function AdminPasswordProtection({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [lockoutTime, setLockoutTime] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 使用安全的认证API
      const response = await fetch('/api/ai-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success) {
        // 存储 JWT Token
        localStorage.setItem('admin-token', data.token);

        // 显示警告信息（如果使用临时模式）
        if (data.warning) {
          console.warn('⚠️', data.warning);
        }

        onSuccess();
      } else {
        // 处理不同的错误情况
        if (response.status === 429) {
          // 速率限制
          setError(data.error)
          setLockoutTime(data.lockedUntil)
        } else {
          // 密码错误
          setError(data.error || '认证失败')
          setAttemptsLeft(data.attemptsLeft ?? null)
        }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🔐 BOSS管理后台</h1>
          <p className="text-gray-600">请输入管理员密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
              <div className="font-semibold">{error}</div>
              {attemptsLeft !== null && attemptsLeft > 0 && (
                <div className="mt-1 text-xs">
                  剩余尝试次数: {attemptsLeft}/5
                </div>
              )}
              {lockoutTime !== null && (
                <div className="mt-1 text-xs">
                  请等待 {lockoutTime} 秒后再试
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? '🔄 验证中...' : '进入管理后台'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            🛡️ 安全验证保护
          </div>
        </div>
      </div>
    </div>
  )
}

// 主管理界面
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'ai' | 'posts' | 'recycle' | 'sanity' | 'wechat'>('ai')

  const tabs = [
    { id: 'ai' as const, name: '🤖 AI内容生成', icon: '🚀' },
    { id: 'posts' as const, name: '📚 文章管理', icon: '📝' },
    { id: 'wechat' as const, name: '📱 公众号发布', icon: '💬' },
    { id: 'recycle' as const, name: '🗑️ 回收站管理', icon: '♻️' },
    { id: 'sanity' as const, name: '📝 内容管理', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">👑 BOSS管理后台</h1>
            <div className="flex items-center gap-4">
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

          {/* 标签导航 */}
          <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 每日资源推荐 - 显示在所有tab上方 */}
        <DailyRecommendation />

        {activeTab === 'ai' && <AIGeneratorTab />}
        {activeTab === 'posts' && <PostManagementTab />}
        {activeTab === 'wechat' && (
          <div>
            <iframe
              src="/wechat-publisher"
              className="w-full h-[calc(100vh-300px)] border-0 rounded-lg shadow-lg"
              title="公众号内容生成器"
            />
          </div>
        )}
        {activeTab === 'recycle' && <RecycleBinTab />}
        {activeTab === 'sanity' && <SanityStudioTab />}
      </div>
    </div>
  )
}

// 主组件
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  // 页面加载时检查已有 token 是否有效
  useEffect(() => {
    document.title = '📊 BOSS管理中心 - 网盘博客管理系统'
    const token = localStorage.getItem('admin-token')
    if (token) {
      // 用一个轻量 API 验证 token 是否还有效
      fetch('/api/generate-content', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(resp => {
        if (resp.ok) setIsAuthenticated(true)
      }).catch(() => {}).finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin-token')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <p className="text-gray-600">验证中...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminPasswordProtection onSuccess={handleLogin} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}