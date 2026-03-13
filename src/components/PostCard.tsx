'use client'

import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { Post } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const getImageUrl = () => {
    if (post.mainImageUrl) return post.mainImageUrl
    if (post.mainImage?.customUrl) return post.mainImage.customUrl
    if (post.mainImage && post.mainImage.asset) {
      try {
        return urlFor(post.mainImage).width(600).height(300).url()
      } catch {
        // fallback
      }
    }

    const isMoviePost = post.categories?.some(cat =>
      ['电影', '影视', '娱乐', '剧集', '动画'].includes(cat.title)
    ) || ['电影', '影片', '电视剧', '纪录片', '动画', '剧集'].some(keyword =>
      post.title.includes(keyword)
    )
    if (isMoviePost) return null

    return `/api/placeholder?text=${encodeURIComponent(post.title.slice(0, 10))}&width=600&height=300`
  }

  const imageUrl = getImageUrl()

  return (
    <article className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {imageUrl && (
        <Link href={`/posts/${post.slug.current}`} className="block">
          <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              quality={75}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        </Link>
      )}

      <div className="p-4">
        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug.current}`}
                className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
              >
                {category.title}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-base sm:text-lg font-semibold leading-snug mb-2">
          <Link
            href={`/posts/${post.slug.current}`}
            className="text-gray-900 hover:text-blue-600 transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{post.author?.name || '博主'}</span>
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {format(new Date(post.publishedAt), 'yyyy年M月d日', { locale: zhCN })}
            </time>
          )}
        </div>
      </div>
    </article>
  )
}
