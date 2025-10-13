'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'
import Link from 'next/link'

export default function SanityStudioTab() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center mb-2">
          📝 Sanity内容管理
        </h2>
        <p className="text-gray-600 mb-4">直接管理和编辑网站内容</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">
            💡 <strong>提示：</strong>如果在这里看不到完整的编辑界面或发布按钮，请使用独立的 Studio 页面：
          </p>
          <Link
            href="/studio"
            target="_blank"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🚀 打开完整的 Sanity Studio
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
        <NextStudio config={config} />
      </div>
    </div>
  )
}