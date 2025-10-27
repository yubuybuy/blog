'use client';

import { useState, useEffect } from 'react';

interface WeChatArticle {
  title: string;
  author: string;
  excerpt: string;
  content: string;
  articleUrl: string;
  mainImage: string;
  slug: string;
}

export default function WeChatPublisherPage() {
  const [articles, setArticles] = useState<WeChatArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<WeChatArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wechat-content?limit=20');
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
        if (data.data.length > 0) {
          setSelectedArticle(data.data[0]);
        }
      }
    } catch (error) {
      console.error('获取文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyContent = () => {
    if (!selectedArticle) return;

    const contentElement = document.getElementById('wechat-content');
    if (!contentElement) return;

    try {
      // 创建一个range对象
      const range = document.createRange();
      range.selectNodeContents(contentElement);

      // 获取selection对象
      const selection = window.getSelection();
      if (!selection) return;

      selection.removeAllRanges();
      selection.addRange(range);

      // 复制
      document.execCommand('copy');

      // 清除选择
      selection.removeAllRanges();

      // 显示成功提示
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败,请手动选择内容复制');
    }
  };

  const copyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type}已复制到剪贴板!`);
    }).catch(() => {
      alert('复制失败,请手动复制');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📱 公众号内容生成器
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                选择文章,一键复制到公众号
              </p>
            </div>
            <a
              href="/boss-admin"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← 返回后台
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧: 文章列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  文章列表
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  共 {articles.length} 篇文章
                </p>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                {articles.map((article, index) => (
                  <div
                    key={article.slug}
                    onClick={() => setSelectedArticle(article)}
                    className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedArticle?.slug === article.slug
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {article.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {article.author}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧: 内容预览和操作 */}
          <div className="lg:col-span-2">
            {selectedArticle ? (
              <div className="space-y-6">
                {/* 操作区 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    快速操作
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        文章标题
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          readOnly
                          value={selectedArticle.title}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyText(selectedArticle.title, '标题')}
                          className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                        >
                          复制
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        阅读原文链接
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          readOnly
                          value={selectedArticle.articleUrl}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyText(selectedArticle.articleUrl, '链接')}
                          className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                        >
                          复制
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        封面图链接
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          readOnly
                          value={selectedArticle.mainImage || '无封面图'}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyText(selectedArticle.mainImage, '图片链接')}
                          className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                          disabled={!selectedArticle.mainImage}
                        >
                          复制
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={copyContent}
                      className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    >
                      📋 一键复制文章内容
                    </button>
                    {copySuccess && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800 text-center">
                          ✅ 内容已复制到剪贴板!现在可以粘贴到公众号了
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 使用指南 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-yellow-900 mb-3">
                    📋 使用步骤
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                    <li>点击上方"一键复制文章内容"按钮</li>
                    <li>打开公众号后台: <a href="https://mp.weixin.qq.com/" target="_blank" rel="noopener noreferrer" className="underline">https://mp.weixin.qq.com/</a></li>
                    <li>新建图文消息,在编辑器中按 Ctrl+V 粘贴</li>
                    <li>复制"阅读原文链接",设置到公众号的原文链接</li>
                    <li>如果有封面图,复制封面图链接并下载设置</li>
                    <li>预览检查,然后发布!</li>
                  </ol>
                </div>

                {/* 内容预览 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    内容预览
                  </h2>
                  <div
                    id="wechat-content"
                    className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-6 bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">请从左侧选择文章</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
