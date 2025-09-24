'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'
import { useEffect } from 'react'

export default function StudioPage() {
  useEffect(() => {
    console.log('🔧 Sanity Studio 加载中...')
    console.log('📋 配置信息:', {
      projectId: config.projectId,
      dataset: config.dataset,
      title: config.title
    })

    // 监听Studio加载完成
    const checkStudio = () => {
      const studio = document.querySelector('[data-sanity-root]')
      if (studio) {
        console.log('✅ Sanity Studio 已加载')
        console.log('🗑️ 删除功能应该在文档编辑页面的右上角菜单中')
        console.log('🔄 刷新404问题已修复 - ' + new Date().toLocaleString())
      } else {
        setTimeout(checkStudio, 1000)
      }
    }

    setTimeout(checkStudio, 2000)
  }, [])

  return (
    <div style={{ height: '100vh' }}>
      <NextStudio config={config} />
    </div>
  )
}