/**
 * 资源管理Web界面
 * 访问: http://localhost:3000/resource-manager (开发环境)
 */

'use client';

import { useState, useEffect } from 'react';

interface Resource {
  id: string;
  title: string;
  category: string;
  downloadLink: string;
  extractCode?: string;
  description: string;
  tags: string[];
  source: string;
  priority: number;
  notes?: string;
  collectedAt: string;
  status: '待发布' | '已生成' | '已发布' | '链接失效';
  linkStatus: '未检查' | '有效' | '失效';
  publishedAt?: string;
}

export default function ResourceManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<string[]>([
    '电影', '电视剧', '纪录片', '软件', '教育', '书籍', '音乐', '游戏', '设计', '其他'
  ]);

  const [formData, setFormData] = useState<Partial<Resource>>({
    title: '',
    category: '电影',
    downloadLink: '',
    extractCode: '',
    description: '',
    tags: [],
    source: '',
    priority: 3,
    notes: '',
    status: '待发布',
    linkStatus: '未检查'
  });

  const [filter, setFilter] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  });

  // 加载资源
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('加载资源失败:', error);
    }
  };

  // 添加资源
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newResource: Resource = {
      ...formData as Resource,
      id: `RES-${Date.now()}`,
      collectedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource)
      });

      if (response.ok) {
        setResources([newResource, ...resources]);
        setShowForm(false);
        setFormData({
          title: '',
          category: '电影',
          downloadLink: '',
          extractCode: '',
          description: '',
          tags: [],
          source: '',
          priority: 3,
          notes: '',
          status: '待发布',
          linkStatus: '未检查'
        });
        alert('✅ 资源添加成功！');
      }
    } catch (error) {
      console.error('添加资源失败:', error);
      alert('❌ 添加失败，请重试');
    }
  };

  // 删除资源
  const deleteResource = async (id: string) => {
    if (!confirm('确定删除这个资源吗？')) return;

    try {
      await fetch(`/api/resources?id=${id}`, { method: 'DELETE' });
      setResources(resources.filter(r => r.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 更新资源状态
  const updateStatus = async (id: string, status: Resource['status']) => {
    try {
      await fetch('/api/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      setResources(resources.map(r =>
        r.id === id ? { ...r, status } : r
      ));
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  // 过滤资源
  const filteredResources = resources.filter(r => {
    if (filter.status !== 'all' && r.status !== filter.status) return false;
    if (filter.category !== 'all' && r.category !== filter.category) return false;
    if (filter.priority !== 'all' && r.priority !== parseInt(filter.priority)) return false;
    return true;
  });

  // 统计数据
  const stats = {
    total: resources.length,
    pending: resources.filter(r => r.status === '待发布').length,
    published: resources.filter(r => r.status === '已发布').length,
    invalid: resources.filter(r => r.linkStatus === '失效').length,
    highPriority: resources.filter(r => r.priority >= 4).length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📦 资源管理中心</h1>
              <p className="text-gray-600 mt-1">统一管理你的所有资源</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {showForm ? '❌ 取消' : '➕ 添加资源'}
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">总资源数</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
            <div className="text-sm text-yellow-700">待发布</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <div className="text-sm text-green-700">已发布</div>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm p-4">
            <div className="text-sm text-red-700">链接失效</div>
            <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm p-4">
            <div className="text-sm text-purple-700">高优先级</div>
            <div className="text-2xl font-bold text-purple-600">{stats.highPriority}</div>
          </div>
        </div>

        {/* 添加资源表单 */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">添加新资源</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    资源名称 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：《肖申克的救赎》4K超清版"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分类 *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    网盘链接 *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.downloadLink}
                    onChange={(e) => setFormData({...formData, downloadLink: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="https://pan.quark.cn/s/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    提取码
                  </label>
                  <input
                    type="text"
                    value={formData.extractCode}
                    onChange={(e) => setFormData({...formData, extractCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    来源
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="贴吧/QQ频道/网站"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优先级 *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 最高优先级</option>
                    <option value={4}>⭐⭐⭐⭐ 高优先级</option>
                    <option value={3}>⭐⭐⭐ 普通</option>
                    <option value={2}>⭐⭐ 低优先级</option>
                    <option value={1}>⭐ 最低优先级</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  资源描述 *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="详细描述资源内容、特点等..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="经典, 高分, 剧情"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="其他需要记录的信息..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  💾 保存资源
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 过滤器 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm text-gray-600 mr-2">状态:</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部</option>
                <option value="待发布">待发布</option>
                <option value="已生成">已生成</option>
                <option value="已发布">已发布</option>
                <option value="链接失效">链接失效</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mr-2">分类:</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({...filter, category: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mr-2">优先级:</label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({...filter, priority: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="2">⭐⭐</option>
                <option value="1">⭐</option>
              </select>
            </div>

            <div className="ml-auto">
              <span className="text-sm text-gray-600">
                显示 {filteredResources.length} / {resources.length} 个资源
              </span>
            </div>
          </div>
        </div>

        {/* 资源列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">资源名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">收集时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{resource.description.substring(0, 50)}...</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{resource.category}</td>
                  <td className="px-6 py-4 text-sm">{'⭐'.repeat(resource.priority)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={resource.status}
                      onChange={(e) => updateStatus(resource.id, e.target.value as Resource['status'])}
                      className="text-xs px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="待发布">待发布</option>
                      <option value="已生成">已生成</option>
                      <option value="已发布">已发布</option>
                      <option value="链接失效">链接失效</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{resource.source}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(resource.collectedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredResources.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>暂无资源</p>
              <p className="text-sm mt-2">点击上方&ldquo;添加资源&rdquo;按钮开始添加</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
