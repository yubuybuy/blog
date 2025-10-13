'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'
import Link from 'next/link'

export default function SanityStudioTab() {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center mb-2">
          📝 Sanity内容管理
        </h2>
        <p className="text-gray-600 text-sm mb-3">直接管理和编辑网站内容</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 mb-2">
            💡 如果界面显示不完整，建议使用全屏模式：
          </p>
          <Link
            href="/studio"
            target="_blank"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            🚀 全屏打开 Sanity Studio
          </Link>
        </div>
      </div>

      {/* 给 Studio 足够的空间显示所有按钮 */}
      <div className="flex-1 overflow-hidden">
        <NextStudio config={config} />
      </div>
    </div>
  )
}