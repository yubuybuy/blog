'use client'

import { useLayoutEffect } from 'react'

const STORAGE_KEY = 'posts-scroll-y'

export default function ScrollRestore() {
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return

    const y = parseInt(saved, 10)
    sessionStorage.removeItem(STORAGE_KEY)

    // 绘制前立即隐藏页面，用户看不到错误位置
    const html = document.documentElement
    html.style.visibility = 'hidden'

    // 用 setTimeout + rAF 确保在 Next.js 完成自身滚动管理之后再恢复
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, y)
        html.style.visibility = ''
      })
    }, 0)

    // 兜底：万一出问题，300ms 后强制恢复显示
    const safety = setTimeout(() => {
      html.style.visibility = ''
    }, 300)

    return () => {
      clearTimeout(timer)
      clearTimeout(safety)
      html.style.visibility = ''
    }
  }, [])

  return null
}
