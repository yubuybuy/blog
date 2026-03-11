'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'posts-scroll-y'

export default function ScrollRestore() {
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const y = parseInt(saved, 10)
      sessionStorage.removeItem(STORAGE_KEY)
      // 等待页面渲染完成后恢复滚动位置
      requestAnimationFrame(() => {
        window.scrollTo(0, y)
      })
    }
  }, [])

  return null
}
