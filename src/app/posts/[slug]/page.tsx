import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import { getPost, getPosts, getSiteName, getSiteSettings } from '@/lib/queries'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import MarkdownImage from '@/components/MarkdownImage'
import JsonLd from '@/components/JsonLd'
import Breadcrumbs from '@/components/Breadcrumbs'
import sanitizeHtml from 'sanitize-html'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post: { slug: { current: string } }) => ({
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
    description: post.excerpt || `阅读关于&ldquo;${post.title}&rdquo;的详细内容，了解更多相关信息和见解。`,
    keywords: post.categories?.map((cat: { title: string }) => cat.title).join(', ') || '',
    authors: [{ name: post.author?.name || '博主' }],
    openGraph: {
      title: post.title,
      description: post.excerpt || `阅读关于&ldquo;${post.title}&rdquo;的详细内容`,
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
      tags: post.categories?.map((cat: { title: string }) => cat.title) || []
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `阅读关于&ldquo;${post.title}&rdquo;的详细内容`,
      images: [imageUrl],
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
    image: ({ value }: { value: { asset?: unknown; alt?: string; [key: string]: unknown } }) => (
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
    link: ({ children, value }: { children: React.ReactNode; value: { href: string } }) => (
      <a
        href={value.href}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    imageMarkdown: ({ children }: { children: React.ReactNode }) => {
      // 解析markdown图片语法
      if (!children || (Array.isArray(children) && children.length === 0)) {
        return <span></span>;
      }
      const text = Array.isArray(children) ? children[0] : children;
      if (typeof text !== 'string') {
        return <span>{children}</span>;
      }
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
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-xl sm:text-2xl font-bold mt-5 sm:mt-6 mb-2 sm:mb-3">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-lg sm:text-xl font-bold mt-4 sm:mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-gray-300 pl-3 sm:pl-4 italic my-4 text-sm sm:text-base">
        {children}
      </blockquote>
    ),
    normal: ({ children }: { children: React.ReactNode }) => {
      // 检查是否包含图片markdown
      const childArray = Array.isArray(children) ? children : [children];
      const hasImageMarkdown = childArray.some((child: unknown) =>
        typeof child === 'string' && child.match(/!\[.*?\]\(.*?\)/)
      );

      if (hasImageMarkdown) {
        return (
          <div>
            {childArray.map((child: unknown, index: number) => {
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
              return <span key={index}>{typeof child === 'string' || typeof child === 'number' ? child : ''}</span>;
            })}
          </div>
        );
      }
      return <p className="mb-3 sm:mb-4 leading-6 sm:leading-7 text-sm sm:text-base">{children}</p>;
    },
  },
  list: {
    bullet: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }: { children: React.ReactNode }) => (
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
          const htmlContent = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
          const sanitized = sanitizeHtml(htmlContent, {
            allowedTags: ['a', 'strong', 'em', 'b', 'i', 'code', 'br'],
            allowedAttributes: {
              'a': ['href', 'class', 'target', 'rel']
            },
            allowedSchemes: ['http', 'https', 'mailto']
          });
          return <p key={index} className="mb-4 leading-7" dangerouslySetInnerHTML={{
            __html: sanitized
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
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={breadcrumbs} />
      {/* Article Header */}
      <header className="mb-6">
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.categories.map((category: { _id: string; slug: { current: string }; title: string }) => (
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

        <h1 className="article-headline text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="article-summary text-gray-500 mb-4">{post.excerpt}</p>
        )}

        <div className="flex items-center text-sm text-gray-500 mb-6">
          {post.author?.image && (
            <div className="relative w-8 h-8 mr-2">
              <Image
                src={urlFor(post.author.image).width(32).height(32).url()}
                alt={post.author.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}
          <span className="font-medium text-gray-700">{post.author?.name || '博主'}</span>
            {post.publishedAt && (
              <span className="mx-1.5 text-gray-300">|</span>
            )}
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), 'yyyy年M月d日', { locale: zhCN })}
              </time>
            )}
            {post._updatedAt && post._updatedAt !== post.publishedAt && (
              <span className="text-xs text-gray-400 ml-1.5">
                (更新于 {format(new Date(post._updatedAt), 'yyyy年M月d日', { locale: zhCN })})
              </span>
            )}
        </div>

        {post.mainImage && (
          <div className="relative h-48 sm:h-64 md:h-80 mb-6">
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
          // @ts-expect-error - PortableText 类型兼容性问题
          <PortableText value={post.body} components={portableTextComponents} />
        ) : (
          <p>内容加载中...</p>
        )}
      </div>

      {/* Author Bio */}
      {post.author?.bio && (
        <footer className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3">
            {post.author.image && (
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src={urlFor(post.author.image).width(40).height(40).url()}
                  alt={post.author.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {post.author.name}
              </h3>
              <div className="text-sm text-gray-500">
                <PortableText value={post.author.bio} />
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* 相关内容 */}
      {post.categories && post.categories.length > 0 && (
        <section className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href={`/categories/${post.categories[0].slug.current}`}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            查看更多「{post.categories[0].title}」相关内容 &rarr;
          </Link>
        </section>
      )}
    </article>
    </>
  )
}