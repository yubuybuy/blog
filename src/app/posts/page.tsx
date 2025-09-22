import PostCard from '@/components/PostCard'
import { getPosts } from '@/lib/queries'
import { Post } from '@/types'

export const metadata = {
  title: '所有文章 - 我的博客',
  description: '浏览所有博客文章',
}

export const revalidate = 0 // 禁用缓存，确保获取最新文章

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          所有文章
        </h1>
        <p className="text-gray-600">
          浏览所有的博客文章和思考
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: Post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            还没有文章
          </h3>
          <p className="text-gray-600">
            请先在Sanity CMS中添加一些文章内容
          </p>
        </div>
      )}
    </div>
  )
}