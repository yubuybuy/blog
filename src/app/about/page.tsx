import { getSiteName, getSiteSettings } from '@/lib/queries'

export const revalidate = 3600

export async function generateMetadata() {
  const siteName = await getSiteName()
  return {
    title: `关于 - ${siteName}`,
    description: '了解觅库 — 一个专注于网盘资源分享的中文博客',
  }
}

export default async function AboutPage() {
  const siteSettings = await getSiteSettings()
  const siteName = siteSettings?.title || '觅库'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        关于{siteName}
      </h1>

      <div className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          {siteName}是一个专注于网盘资源分享的中文博客。我们为用户提供电影、软件、游戏等各类优质资源的详细介绍和网盘下载链接。
        </p>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">网站内容</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>电影资源 — IMDB Top 250 经典电影、热门新片推荐</li>
            <li>软件资源 — 实用工具软件推荐与分享</li>
            <li>游戏资源 — 热门游戏介绍与下载</li>
            <li>教程资源 — 技术学习教程与指南</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">免责声明</h2>
          <p className="text-sm text-gray-500">
            本站仅提供信息分享交流平台，所有内容均来源于网络公开分享链接，仅供学习参考使用。
            本站不存储任何文件，不提供下载服务。支持正版，尊重版权。如有版权问题，请及时联系我们处理。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">联系方式</h2>
          <ul className="space-y-1 text-gray-600">
            {siteSettings?.email && (
              <li>邮箱：<a href={`mailto:${siteSettings.email}`} className="text-blue-600 hover:underline">{siteSettings.email}</a></li>
            )}
            {siteSettings?.github && (
              <li>GitHub：<a href={siteSettings.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{siteSettings.github}</a></li>
            )}
            {!siteSettings?.email && !siteSettings?.github && (
              <li>请通过<a href="/copyright" className="text-blue-600 hover:underline">版权声明</a>页面中的邮箱联系我们</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
