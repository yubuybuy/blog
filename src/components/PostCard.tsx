'use client'

import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { Post } from '@/types'
import { format } from 'date-fns'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  // 强制为每个文章生成图片URL
  const getImageUrl = () => {
    console.log('PostCard - 检查图片:', {
      mainImageUrl: post.mainImageUrl,
      mainImage: post.mainImage,
      title: post.title
    });

    // 检查是否有自定义图片URL
    if (post.mainImageUrl) {
      console.log('使用mainImageUrl:', post.mainImageUrl);
      return post.mainImageUrl;
    }

    // 检查Sanity图像的自定义URL
    if (post.mainImage?.customUrl) {
      console.log('使用customUrl:', post.mainImage.customUrl);
      return post.mainImage.customUrl;
    }

    // 最后使用Sanity图像
    if (post.mainImage && post.mainImage.asset) {
      try {
        const sanityUrl = urlFor(post.mainImage).width(600).height(300).url();
        console.log('使用Sanity URL:', sanityUrl);
        return sanityUrl;
      } catch (error) {
        console.warn('Sanity image URL生成失败:', error);
      }
    }

    // 如果都没有，检查是否为电影类内容
    // 对于电影内容，如果没有海报则不显示图片
    const isMoviePost = post.categories?.some(cat =>
      ['电影', '影视', '娱乐', '剧集', '动画'].includes(cat.title)
    ) || ['电影', '影片', '电视剧', '纪录片', '动画', '剧集'].some(keyword =>
      post.title.includes(keyword)
    );

    if (isMoviePost) {
      console.log('电影内容无海报，不显示图片');
      return null; // 不显示图片
    }

    // 非电影内容使用本地占位图片
    const fallbackUrl = `/api/placeholder?text=${encodeURIComponent(post.title.slice(0, 10))}&width=600&height=300`;
    console.log('使用fallback URL:', fallbackUrl);
    return fallbackUrl;
  };

  const imageUrl = getImageUrl();

  return (
    <article className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl overflow-hidden border border-gray-100 hover:border-purple-200 transition-all duration-500 hover:-translate-y-2">
      {/* 只在有图片时显示图片区域 */}
      {imageUrl && (
        <Link href={`/posts/${post.slug.current}`}>
          <div className="relative h-40 sm:h-48 md:h-56 w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
              quality={75}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                console.error('PostCard图片加载失败:', imageUrl);
                // 图片加载失败时隐藏图片而不是显示另一个随机图片
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </Link>
      )}

      <div className="p-4 sm:p-6 md:p-8">
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

        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 leading-tight">
          <Link
            href={`/posts/${post.slug.current}`}
            className="text-gray-900 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text hover:text-transparent transition-all duration-300"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-gray-600 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 leading-relaxed text-sm sm:text-base">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500">
          <div className="flex items-center">
            {post.author?.image ? (
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0">
                <Image
                  src={urlFor(post.author.image).width(32).height(32).url()}
                  alt={post.author.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                📝
              </div>
            )}
            <span className="font-medium truncate">{post.author?.name || '博主'}</span>
          </div>

          {post.publishedAt && (
            <time dateTime={post.publishedAt} className="bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs flex-shrink-0">
              {format(new Date(post.publishedAt), 'MM月dd日')}
            </time>
          )}
        </div>

        {/* 阅读更多按钮 */}
        <Link
          href={`/posts/${post.slug.current}`}
          className="inline-flex items-center mt-3 sm:mt-4 text-purple-600 hover:text-purple-800 font-semibold text-sm group"
        >
          阅读文章
          <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}