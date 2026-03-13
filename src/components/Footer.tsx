import Link from 'next/link'
import { getSiteSettings } from '@/lib/queries'

export default async function Footer() {
  const siteSettings = await getSiteSettings()
  const siteName = siteSettings?.title || 'USEIT库'

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          {/* Site info */}
          <div className="max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-1">{siteName}</h3>
            <p className="text-sm text-gray-500">
              {siteSettings?.footerDescription || '网盘资源分享与推荐，涵盖电影、软件、游戏等优质内容。'}
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">导航</h4>
              <ul className="space-y-1.5">
                <li><Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">首页</Link></li>
                <li><Link href="/posts" className="text-gray-500 hover:text-gray-900 transition-colors">全部资源</Link></li>
                <li><Link href="/categories" className="text-gray-500 hover:text-gray-900 transition-colors">分类浏览</Link></li>
                <li><Link href="/about" className="text-gray-500 hover:text-gray-900 transition-colors">关于本站</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">其他</h4>
              <ul className="space-y-1.5">
                <li><Link href="/copyright" className="text-gray-500 hover:text-gray-900 transition-colors">版权声明</Link></li>
                {siteSettings?.email && (
                  <li><a href={`mailto:${siteSettings.email}`} className="text-gray-500 hover:text-gray-900 transition-colors">联系邮箱</a></li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 space-y-2">
          <p>
            本站仅提供信息分享，所有资源来源于网络，仅供学习参考。如有版权问题请联系删除。
          </p>
          <p>
            &copy; {new Date().getFullYear()} {siteName}{siteSettings?.copyrightText ? ` - ${siteSettings.copyrightText}` : ''}
          </p>
        </div>
      </div>
    </footer>
  )
}
