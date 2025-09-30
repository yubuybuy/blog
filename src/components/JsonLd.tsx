import { Post, SiteSettings } from '@/types'

interface JsonLdProps {
  post?: Post
  siteSettings?: SiteSettings | null
  type: 'website' | 'article' | 'breadcrumb'
  breadcrumbs?: Array<{ name: string; url: string }>
}

export default function JsonLd({ post, siteSettings, type, breadcrumbs }: JsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'
  const siteName = siteSettings?.title || 'USEIT库'
  const siteDescription = siteSettings?.heroSubtitle || '分享技术、生活和思考，记录成长的点点滴滴'

  const generateJsonLd = () => {
    switch (type) {
      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteName,
          description: siteDescription,
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          },
          publisher: {
            '@type': 'Organization',
            name: siteName,
            url: baseUrl,
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`
            }
          }
        }

      case 'article':
        if (!post) return null
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt || post.title,
          image: post.mainImageUrl || (post.mainImage ? `${baseUrl}/api/placeholder?text=${encodeURIComponent(post.title.slice(0, 10))}&width=1200&height=630` : undefined),
          datePublished: post.publishedAt,
          dateModified: post._updatedAt || post.publishedAt,
          author: {
            '@type': 'Person',
            name: post.author?.name || '博主',
            url: baseUrl
          },
          publisher: {
            '@type': 'Organization',
            name: siteName,
            url: baseUrl,
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`
            }
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${baseUrl}/posts/${post.slug.current}`
          },
          articleSection: post.categories?.map(cat => cat.title) || [],
          keywords: post.categories?.map(cat => cat.title).join(', ') || ''
        }

      case 'breadcrumb':
        if (!breadcrumbs) return null
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: `${baseUrl}${crumb.url}`
          }))
        }

      default:
        return null
    }
  }

  const jsonLd = generateJsonLd()
  if (!jsonLd) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}