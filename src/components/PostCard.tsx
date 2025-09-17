import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { Post } from '@/types'
import { format } from 'date-fns'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {post.mainImage && (
        <Link href={`/posts/${post.slug.current}`}>
          <div className="relative h-48 w-full">
            <Image
              src={urlFor(post.mainImage).width(600).height(300).url()}
              alt={post.mainImage.alt || post.title}
              fill
              className="object-cover"
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.categories?.map((category) => (
            <Link
              key={category._id}
              href={`/categories/${category.slug.current}`}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
            >
              {category.title}
            </Link>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-2">
          <Link
            href={`/posts/${post.slug.current}`}
            className="text-gray-900 hover:text-blue-600 transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            {post.author?.image && (
              <div className="relative w-8 h-8 mr-3">
                <Image
                  src={urlFor(post.author.image).width(32).height(32).url()}
                  alt={post.author.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <span>{post.author?.name}</span>
          </div>

          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
            </time>
          )}
        </div>
      </div>
    </article>
  )
}