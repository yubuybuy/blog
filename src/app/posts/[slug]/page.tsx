import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import { getPost, getPosts, getSiteName, getSiteSettings } from '@/lib/queries'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import MarkdownImage from '@/components/MarkdownImage'
import JsonLd from '@/components/JsonLd'
import Breadcrumbs from '@/components/Breadcrumbs'

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
  const [post, siteName, siteSettings] = await Promise.all([
    getPost(slug),
    getSiteName(),
    getSiteSettings()
  ])

  if (!post) {
    return {
      title: '文章不存在',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'
  const imageUrl = post.mainImageUrl ||
    (post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() :
    `${baseUrl}/api/placeholder?text=${encodeURIComponent(post.title.slice(0, 10))}&width=1200&height=630`)

  return {
    title: `${post.title} - ${siteName}`,
    description: post.excerpt || `阅读关于"${post.title}"的详细内容，了解更多相关信息和见解。`,
    keywords: post.categories?.map(cat => cat.title).join(', ') || '',
    authors: [{ name: post.author?.name || '博主' }],
    openGraph: {
      title: post.title,
      description: post.excerpt || `阅读关于"${post.title}"的详细内容`,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: post.title
      }],
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt || post.publishedAt,
      authors: [post.author?.name || '博主'],
      section: post.categories?.[0]?.title || '文章',
      tags: post.categories?.map(cat => cat.title) || []
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `阅读关于"${post.title}"的详细内容`,
      images: [imageUrl],
      creator: '@yourusername'
    },
    alternates: {
      canonical: `${baseUrl}/posts/${slug}`
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  }
}

const portableTextComponents = {
  types: {
    image: ({ value }: any) => (
      <div className="my-6 sm:my-8">
        <Image
          src={urlFor(value).width(800).height(400).url()}
          alt={value.alt || 'Article image'}
          width={800}
          height={400}
          className="rounded-lg w-full h-auto"
          loading="lazy"
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
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
      <h1 className="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl sm:text-2xl font-bold mt-5 sm:mt-6 mb-2 sm:mb-3">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg sm:text-xl font-bold mt-4 sm:mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-3 sm:pl-4 italic my-4 text-sm sm:text-base">
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
                  return (
                    <div key={index} className="my-4 sm:my-6">
                      <Image
                        src={imageMatch[2]}
                        alt={imageMatch[1] || 'Generated image'}
                        width={800}
                        height={400}
                        className="rounded-lg w-full h-auto"
                        loading="lazy"
                        quality={75}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                      />
                      {imageMatch[1] && (
                        <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">{imageMatch[1]}</p>
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
      return <p className="mb-3 sm:mb-4 leading-6 sm:leading-7 text-sm sm:text-base">{children}</p>;
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

// 自定义markdown处理组件
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="prose prose-lg max-w-none">
      {lines.map((line, index) => {
        // 处理图片
        if (line.match(/!\[.*?\]\(.*?\)/)) {
          const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
          if (imageMatch) {
            const imageUrl = imageMatch[2];
            const altText = imageMatch[1] || 'Article image';

            return (
              <MarkdownImage key={index} src={imageUrl} alt={altText} />
            );
          }
        }

        // 处理标题
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-bold mt-5 mb-2">{line.substring(4)}</h3>;
        }

        // 处理普通段落（包含链接）
        if (line.trim()) {
          return <p key={index} className="mb-4 leading-7" dangerouslySetInnerHTML={{
            __html: line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
          }} />;
        }

        // 空行
        return <br key={index} />;
      })}
    </div>
  );
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const [post, siteSettings] = await Promise.all([
    getPost(slug),
    getSiteSettings()
  ])

  if (!post) {
    notFound()
  }

  // 生成面包屑
  const breadcrumbs = [
    { name: '首页', url: '/' },
    { name: '文章', url: '/posts' },
    { name: post.title, url: `/posts/${slug}` }
  ]

  // 如果有分类，添加到面包屑中
  if (post.categories && post.categories.length > 0) {
    breadcrumbs.splice(2, 0, {
      name: post.categories[0].title,
      url: `/categories/${post.categories[0].slug.current}`
    })
  }

  return (
    <>
      <JsonLd type="article" post={post} siteSettings={siteSettings} />
      <article className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <Breadcrumbs items={breadcrumbs} />
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
      <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
        {post.markdownContent ? (
          // 使用自定义markdown处理
          <MarkdownContent content={post.markdownContent} />
        ) : post.body ? (
          // 降级到原有的PortableText
          <PortableText value={post.body} components={portableTextComponents} />
        ) : (
          <p>内容加载中...</p>
        )}
      </div>

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

      {/* 相关文章推荐 */}
      {post.categories && post.categories.length > 0 && (
        <section className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            相关文章
          </h3>
          <div className="text-sm text-gray-600">
            <Link
              href={`/categories/${post.categories[0].slug.current}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              查看更多{post.categories[0].title}相关文章 →
            </Link>
          </div>
        </section>
      )}
    </article>
    </>
  )
}