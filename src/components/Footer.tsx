import Link from 'next/link'
import { getSiteSettings } from '@/lib/queries'

export default async function Footer() {
  const siteSettings = await getSiteSettings()

  const settings = siteSettings || {
    title: '个人博客',
    footerDescription: '记录生活点滴，分享所思所想，与世界保持连接。',
    email: 'hello@example.com',
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    copyrightText: '用心记录，温暖分享.'
  }

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{settings.title}</h3>
            <p className="text-gray-600">
              {settings.footerDescription}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">站点导航</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-gray-900">
                  文章分类
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900">
                  关于我
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">联系我</h3>
            <ul className="space-y-2">
              {settings.email && (
                <li className="text-gray-600">
                  邮箱：{settings.email}
                </li>
              )}
              {settings.github && (
                <li>
                  <a href={settings.github} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                    GitHub
                  </a>
                </li>
              )}
              {settings.twitter && (
                <li>
                  <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                    Twitter
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <strong>⚠️ 免责声明：</strong>
              本站仅提供信息分享交流，所有资源均来源于网络，仅供学习参考使用。
              如有版权问题，请联系删除。支持正版，尊重版权。
            </p>
            <p className="text-center text-gray-500 space-x-4">
              © {new Date().getFullYear()} {settings.title}. {settings.copyrightText}
              <span className="text-gray-300">|</span>
              <Link href="/copyright" className="text-blue-600 hover:text-blue-800 underline">
                版权声明
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}