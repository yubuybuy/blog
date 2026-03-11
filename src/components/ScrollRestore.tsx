'use client'

import { useLayoutEffect } from 'react'

const STORAGE_KEY = 'posts-scroll-y'

export default function ScrollRestore() {
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const y = parseInt(saved, 10)
      sessionStorage.removeItem(STORAGE_KEY)

      // 恢复前隐藏页面，防止闪烁
      const html = document.documentElement
      html.style.visibility = 'hidden'

      window.scrollTo(0, y)

      // 滚动完成后再显示
      requestAnimationFrame(() => {
        html.style.visibility = ''
      })
    }
  }, [])

  return null
}
