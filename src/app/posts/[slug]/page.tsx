import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import { getPost, getPosts } from '@/lib/queries'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post: any) => ({
    slug: post.slug.current,
  }))
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: '文章不存在',
    }
  }

  return {
    title: `${post.title} - 我的博客`,
    description: post.excerpt || '查看这篇文章的详细内容',
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.mainImage ? [urlFor(post.mainImage).width(1200).height(630).url()] : [],
    },
  }
}

const portableTextComponents = {
  types: {
    image: ({ value }: any) => (
      <div className="my-8">
        <Image
          src={urlFor(value).width(800).height(400).url()}
          alt={value.alt || 'Article image'}
          width={800}
          height={400}
          className="rounded-lg"
        />
      </div>
    ),
  },
  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    imageMarkdown: ({ children }: any) => {
      // 解析markdown图片语法
      const text = children[0];
      const imageMatch = text.match(/!\[(.*?)\]\((.*?)\)/);
      if (imageMatch) {
        return (
          <div className="my-6">
            <Image
              src={imageMatch[2]}
              alt={imageMatch[1] || 'Generated image'}
              width={800}
              height={400}
              className="rounded-lg w-full"
              style={{ height: 'auto' }}
            />
            {imageMatch[1] && (
              <p className="text-center text-sm text-gray-600 mt-2">{imageMatch[1]}</p>
            )}
          </div>
        );
      }
      return <span>{children}</span>;
    },
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-bold mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
        {children}
      </blockquote>
    ),
    normal: ({ children }: any) => {
      // 检查是否包含图片markdown
      const hasImageMarkdown = children.some((child: any) =>
        typeof child === 'string' && child.match(/!\[.*?\]\(.*?\)/)
      );

      if (hasImageMarkdown) {
        return (
          <div>
            {children.map((child: any, index: number) => {
              if (typeof child === 'string' && child.match(/!\[.*?\]\(.*?\)/)) {
                const imageMatch = child.match(/!\[(.*?)\]\((.*?)\)/);
                if (imageMatch) {
                  console.log('发现图片markdown:', child);
                  console.log('图片URL:', imageMatch[2]);
                  return (
                    <div key={index} className="my-6">
                      <Image
                        src={imageMatch[2]}
                        alt={imageMatch[1] || 'Generated image'}
                        width={800}
                        height={400}
                        className="rounded-lg w-full"
                        style={{ height: 'auto' }}
                        onLoad={() => console.log('图片加载成功:', imageMatch[2])}
                        onError={(e) => {
                          console.log('图片加载失败:', imageMatch[2]);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {imageMatch[1] && (
                        <p className="text-center text-sm text-gray-600 mt-2">{imageMatch[1]}</p>
                      )}
                    </div>
                  );
                }
              }
              return <span key={index}>{child}</span>;
            })}
          </div>
        );
      }
      return <p className="mb-4 leading-7">{children}</p>;
    },
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
    ),
  },
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories?.map((category) => (
            <Link
              key={category._id}
              href={`/categories/${category.slug.current}`}
              className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
            >
              {category.title}
            </Link>
          ))}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          {post.title}
        </h1>

        <div className="flex items-center text-gray-600 mb-6">
          {post.author?.image && (
            <div className="relative w-12 h-12 mr-4">
              <Image
                src={urlFor(post.author.image).width(48).height(48).url()}
                alt={post.author.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{post.author?.name}</p>
            {post.publishedAt && (
              <time dateTime={post.publishedAt} className="text-sm">
                {format(new Date(post.publishedAt), 'MMMM dd, yyyy')}
              </time>
            )}
          </div>
        </div>

        {post.mainImage && (
          <div className="relative h-64 md:h-96 mb-8">
            <Image
              src={urlFor(post.mainImage).width(1200).height(600).url()}
              alt={post.mainImage.alt || post.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
      </header>

      {/* Article Content */}
      {post.body && (
        <div className="prose prose-lg max-w-none">
          <PortableText value={post.body} components={portableTextComponents} />
        </div>
      )}

      {/* Author Bio */}
      {post.author?.bio && (
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-start">
            {post.author.image && (
              <div className="relative w-16 h-16 mr-4 flex-shrink-0">
                <Image
                  src={urlFor(post.author.image).width(64).height(64).url()}
                  alt={post.author.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                关于 {post.author.name}
              </h3>
              <div className="text-gray-600">
                <PortableText value={post.author.bio} />
              </div>
            </div>
          </div>
        </footer>
      )}
    </article>
  )
}