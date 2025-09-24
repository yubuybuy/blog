import { getSiteName } from '@/lib/queries'

export async function generateMetadata() {
  const siteName = await getSiteName()
  return {
    title: `版权声明 - ${siteName}`,
    description: '网站版权保护声明和著作权相关规定',
  }
}

export default function CopyrightPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md">
        {/* 页面标题 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">📋 版权声明</h1>
          <p className="text-gray-600 mt-2">著作权保护相关规定和申诉流程</p>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* 网站性质说明 */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ 重要声明</h2>
            <div className="text-yellow-700 space-y-3">
              <p>
                本站仅提供信息分享交流平台，所有内容均来源于网络公开分享链接，仅供学习参考使用。
                本站不存储任何文件，不提供下载服务，仅作信息展示。
              </p>
              <p className="font-semibold">
                支持正版，尊重版权。如有版权问题，请及时联系我们处理。
              </p>
            </div>
          </section>

          {/* 著作权保护声明 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📖 著作权保护声明</h2>

            <div className="space-y-6">
              {/* 权利请求条件 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">权利请求条件</h3>
                <p className="text-blue-700 mb-3">
                  任何个人或单位如果同时符合以下两个条件，可向本站提交权利通知：
                </p>
                <ul className="list-decimal list-inside text-blue-700 space-y-2 ml-4">
                  <li>是某一作品的著作权人和/或依法可以行使信息网络传播权的权利人；</li>
                  <li>认为本站通过公开分享链接收集的信息侵犯了上述作品的权利。</li>
                </ul>
              </div>

              {/* 权利通知要求 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-green-800 mb-3">权利通知要求</h3>
                <p className="text-green-700 mb-3">
                  根据相关法律规定，权利通知必须包含如下资料，请发送至：
                  <a href="mailto:dfftrsxcf@gmail.com" className="text-green-600 font-semibold underline ml-1">
                    dfftrsxcf@gmail.com
                  </a>
                </p>

                <ol className="list-decimal list-inside text-green-700 space-y-3 ml-4">
                  <li>
                    <strong>联络信息：</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>姓名、身份证或护照复印件（对自然人）</li>
                      <li>营业执照复印件（对单位）</li>
                      <li>通信地址、电话号码、传真和电子邮件</li>
                    </ul>
                  </li>
                  <li>
                    <strong>侵权内容：</strong>完整、准确地指明涉嫌侵权作品的名称和登载该作品的网页的具体地址
                  </li>
                  <li>
                    <strong>证明材料：</strong>请提供构成侵权的初步证明材料，如：
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>对涉嫌侵权作品拥有著作权的证明文件</li>
                      <li>依法可以行使信息网络传播权的证明</li>
                      <li>其他相关法律文件</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {/* 处理流程 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">处理流程</h3>
                <div className="text-gray-700 space-y-2">
                  <p>1. 收到有效的权利通知后，我们将在 <strong>24小时内</strong> 初步审核；</p>
                  <p>2. 审核通过后，我们将 <strong>立即删除</strong> 相关侵权内容；</p>
                  <p>3. 处理结果将通过邮件反馈给权利人。</p>
                </div>
              </div>

              {/* 特别提示 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ 特别提示</h3>
                <div className="text-red-700 space-y-3">
                  <p>
                    <strong>权利人应当对通知书的真实性负责。</strong>
                  </p>
                  <p>
                    由于数据量较大，系统屏蔽机制结合人工审查都难免存在疏漏。建议维权者本着实事求是的态度，
                    确保内容确实是属于您的作品，避免因为同名、空内容等对本网站造成错误指责。
                  </p>
                  <p>
                    我们尊重并保护知识产权，致力于为用户提供合法、合规的信息服务。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 联系方式 */}
          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 联系方式</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-700">
                版权相关事务联系邮箱：
                <a href="mailto:dfftrsxcf@gmail.com" className="text-blue-600 font-semibold underline ml-1">
                  dfftrsxcf@gmail.com
                </a>
              </p>
              <p className="text-blue-600 text-sm mt-2">
                我们承诺在收到有效通知后及时处理，感谢您的理解与支持。
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}