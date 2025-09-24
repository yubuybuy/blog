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
          <div className="text-center space-y-4">
            {/* 免责声明 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ 重要声明</h4>
              <p className="text-sm text-yellow-700 mb-2">
                本站仅提供信息分享交流平台，所有内容均来源于网络公开分享链接，仅供学习参考使用。
                本站不存储任何文件，不提供下载服务，仅作信息展示。
              </p>
              <p className="text-sm text-yellow-700">
                <strong>支持正版，尊重版权。</strong>如有版权问题，请及时联系我们处理。
              </p>
            </div>

            {/* 版权保护声明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">📋 著作权保护声明</h4>

              <div className="text-xs text-blue-700 space-y-2">
                <p><strong>权利请求条件：</strong></p>
                <p>任何个人或单位如果同时符合以下条件，可向本站提交权利通知：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>是某一作品的著作权人和/或依法可以行使信息网络传播权的权利人；</li>
                  <li>认为本站收集的公开分享链接信息侵犯了上述作品的权利。</li>
                </ul>

                <p className="mt-3"><strong>权利通知要求：</strong></p>
                <p>权利通知必须包含以下资料（发送至：<a href="mailto:dfftrsxcf@gmail.com" className="text-blue-600 underline">dfftrsxcf@gmail.com</a>）：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>具体联络信息：姓名、身份证明、通信地址、电话、邮箱等；</li>
                  <li>完整、准确指明涉嫌侵权作品的名称和具体页面地址；</li>
                  <li>提供构成侵权的初步证明材料。</li>
                </ul>

                <p className="mt-3 text-blue-600">
                  <strong>特别提示：</strong>权利人应对通知书的真实性负责。建议维权者本着实事求是的态度，
                  确保内容确实属于您的作品，避免因同名、空内容等造成错误指责。
                </p>
              </div>
            </div>

            {/* 版权信息 */}
            <p className="text-center text-gray-500 pt-4">
              © {new Date().getFullYear()} {settings.title}. {settings.copyrightText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}