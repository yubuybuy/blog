'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

export default function SanityStudioTab() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center mb-2">
          📝 Sanity内容管理
        </h2>
        <p className="text-gray-600">直接管理和编辑网站内容</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <NextStudio config={config} />
      </div>
    </div>
  )
}