import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { Post } from '@/types'
import { format } from 'date-fns'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  // 优先使用自定义图片URL，否则使用Sanity图片
  const getImageUrl = () => {
    // 检查是否有自定义图片URL
    if (post.mainImageUrl) {
      return post.mainImageUrl;
    }

    // 检查Sanity图像的自定义URL
    if (post.mainImage?.customUrl) {
      return post.mainImage.customUrl;
    }

    // 最后使用Sanity图像
    if (post.mainImage) {
      try {
        return urlFor(post.mainImage).width(600).height(300).url();
      } catch (error) {
        console.warn('Sanity image URL生成失败:', error);
        return null;
      }
    }

    return null;
  };

  const imageUrl = getImageUrl();
  const hasImage = !!imageUrl;

  return (
    <article className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl overflow-hidden border border-gray-100 hover:border-purple-200 transition-all duration-500 hover:-translate-y-2">
      {hasImage && (
        <Link href={`/posts/${post.slug.current}`}>
          <div className="relative h-48 sm:h-56 w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              unoptimized // 避免外部图片优化问题
              onError={(e) => {
                console.error('PostCard图片加载失败:', imageUrl);
                // 隐藏失败的图片容器
                const container = (e.target as HTMLElement).closest('.relative');
                if (container) {
                  container.style.display = 'none';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </Link>
      )}

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories?.map((category) => (
            <Link
              key={category._id}
              href={`/categories/${category.slug.current}`}
              className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-purple-700 px-3 py-1.5 rounded-full hover:from-purple-100 hover:to-pink-100 transition-all duration-300 font-medium"
            >
              {category.title}
            </Link>
          ))}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold mb-3 leading-tight">
          <Link
            href={`/posts/${post.slug.current}`}
            className="text-gray-900 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text hover:text-transparent transition-all duration-300"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed text-sm sm:text-base">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            {post.author?.image ? (
              <div className="relative w-8 h-8 mr-3">
                <Image
                  src={urlFor(post.author.image).width(32).height(32).url()}
                  alt={post.author.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 mr-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                📝
              </div>
            )}
            <span className="font-medium">{post.author?.name || '博主'}</span>
          </div>

          {post.publishedAt && (
            <time dateTime={post.publishedAt} className="bg-gray-50 px-3 py-1 rounded-full text-xs">
              {format(new Date(post.publishedAt), 'MM月dd日')}
            </time>
          )}
        </div>

        {/* 阅读更多按钮 */}
        <Link
          href={`/posts/${post.slug.current}`}
          className="inline-flex items-center mt-4 text-purple-600 hover:text-purple-800 font-semibold text-sm group"
        >
          阅读文章
          <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}