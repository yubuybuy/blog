import { getSiteName } from '@/lib/queries'

export async function generateMetadata() {
  const siteName = await getSiteName()
  return {
    title: `关于我 - ${siteName}`,
    description: '了解更多关于我和这个博客的信息',
  }
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          关于我
        </h1>
        <p className="text-gray-600">
          了解更多关于我和这个博客的信息
        </p>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            欢迎来到我的博客
          </h2>

          <p className="text-gray-700 mb-6">
            这里是我分享技术、生活和思考的地方。我希望通过写作来记录自己的成长历程，
            同时也希望能够帮助到其他有相同兴趣的朋友。
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            博客主题
          </h3>

          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
            <li>技术分享和教程</li>
            <li>开发经验和心得</li>
            <li>生活感悟和思考</li>
            <li>学习笔记和总结</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            联系我
          </h3>

          <p className="text-gray-700 mb-4">
            如果您有任何问题或建议，欢迎通过以下方式联系我：
          </p>

          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>邮箱：your-email@example.com</li>
            <li>GitHub：github.com/yourusername</li>
            <li>Twitter：@yourusername</li>
          </ul>
        </div>
      </div>
    </div>
  )
}