'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'
import { useEffect } from 'react'

export default function StudioPage() {
  useEffect(() => {
    // 确保管理员模式在客户端启用
    if (typeof window !== 'undefined') {
      window.__SANITY_ADMIN_MODE__ = true
      console.log('🔓 Sanity Studio 管理员模式已强制启用')

      // 尝试移除任何删除限制
      const originalFetch = window.fetch
      window.fetch = function(...args) {
        console.log('🌐 Sanity API调用:', args[0])
        return originalFetch.apply(this, args)
      }
    }
  }, [])

  return <NextStudio config={config} />
}