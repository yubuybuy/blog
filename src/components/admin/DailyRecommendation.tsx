'use client';

import { useState, useEffect } from 'react';

interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  reasons: string[];
  suggestions: string[];
  keywords: string[];
  sources: string[];
  urgency: 'urgent' | 'normal' | 'low';
  secondaryRecommendation?: {
    category: string;
    reason: string;
  };
}

interface Stats {
  totalArticles: number;
  totalCategories: number;
  emptyCategories: number;
  lowCategories: number;
}

export default function DailyRecommendation() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState(0); // 推荐模式: 0, 1, 2 循环

  useEffect(() => {
    loadRecommendation();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecommendation = async () => {
    setLoading(true);
    setError(null);
    console.log(`[推荐系统] 加载推荐 - 模式: ${mode}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const url = `/api/recommendation?mode=${mode}`;
      console.log(`[推荐系统] 请求 URL: ${url}`);

      const response = await fetch(url, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      console.log(`[推荐系统] 收到响应:`, data);

      if (data.success) {
        setRecommendation(data.recommendation);
        setStats(data.stats);
        console.log(`[推荐系统] 推荐分类: ${data.recommendation.category}`);
      } else {
        setError(data.error || '加载推荐失败');
        console.error(`[推荐系统] 失败:`, data.error);
      }
    } catch (error: unknown) {
      console.error('[推荐系统] 加载推荐失败:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('请求超时，请检查网络连接');
      } else {
        setError('网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setMode((prevMode) => (prevMode + 1) % 3); // 循环 0 -> 1 -> 2 -> 0
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">🔥 高优先级</span>;
      case 'medium': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">⚡ 中优先级</span>;
      case 'low': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">💡 低优先级</span>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">❗ 紧急</span>;
      case 'normal': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">✓ 正常</span>;
      case 'low': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">- 不急</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              ⚠️ 推荐系统加载失败
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadRecommendation}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <span>🔄</span>
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  return (
    <div className={`rounded-lg shadow-sm border-2 mb-6 transition-all ${getPriorityColor(recommendation.priority)}`}>
      {/* 头部 - 可折叠 */}
      <div
        className="p-6 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-800">
                📅 今日资源收集推荐
              </h2>
              {getPriorityBadge(recommendation.priority)}
              {getUrgencyBadge(recommendation.urgency)}
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                模式 {mode + 1}/3
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            {collapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 内容 - 可折叠 */}
      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="border-t border-gray-200 pt-6">
            {/* 推荐分类 */}
            <div className="mb-6">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg text-xl font-bold shadow-lg">
                🎯 推荐收集：【{recommendation.category}】类资源
              </div>
            </div>

            {/* 推荐理由 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                推荐理由
              </h3>
              <div className="space-y-2">
                {recommendation.reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 具体建议 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                具体建议
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendation.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 热门关键词 */}
            {recommendation.keywords.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  热门关键词
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.keywords.map((keyword, index) => (
                    <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 资源来源建议 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                去哪里找
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendation.sources.map((source, index) => (
                  <span key={index} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm border border-blue-200">
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* 次要推荐 */}
            {recommendation.secondaryRecommendation && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📌 次要推荐</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{recommendation.secondaryRecommendation.category}</span>
                  {' - '}
                  {recommendation.secondaryRecommendation.reason}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3">
              <a
                href="/boss-ai"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                <span>📝</span>
                快速录入资源
              </a>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? '⏳' : '🔄'}</span>
                {loading ? '加载中...' : '换一个推荐'}
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-lg hover:bg-green-200 transition-colors font-medium"
              >
                <span>✅</span>
                知道了
              </button>
            </div>

            {/* 统计信息 */}
            {stats && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{stats.totalArticles}</div>
                    <div className="text-xs text-gray-500">总文章数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{stats.totalCategories}</div>
                    <div className="text-xs text-gray-500">总分类数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.emptyCategories}</div>
                    <div className="text-xs text-gray-500">空白分类</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.lowCategories}</div>
                    <div className="text-xs text-gray-500">内容不足</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
