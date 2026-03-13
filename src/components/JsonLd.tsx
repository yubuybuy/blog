import { Post, SiteSettings } from '@/types'

interface JsonLdProps {
  post?: Post
  siteSettings?: SiteSettings | null
  type: 'website' | 'article' | 'breadcrumb'
  breadcrumbs?: Array<{ name: string; url: string }>
}

// 从文章 markdown 内容中提取 FAQ（匹配 "### 问题\n回答" 格式）
function extractFaqFromContent(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = []
  const faqSection = content.split('## 常见问题')
  if (faqSection.length < 2) return faqs

  const faqText = faqSection[1].split('\n## ')[0] // 截取到下一个 H2
  const questionBlocks = faqText.split('### ').filter(Boolean)

  for (const block of questionBlocks) {
    const lines = block.trim().split('\n').filter(l => l.trim())
    if (lines.length >= 2) {
      const question = lines[0].replace(/[？?]$/, '？').trim()
      const answer = lines.slice(1).join(' ').trim()
      if (question && answer) {
        faqs.push({ question, answer })
      }
    }
  }
  return faqs
}

export default function JsonLd({ post, siteSettings, type, breadcrumbs }: JsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'
  const siteName = siteSettings?.title || '觅库'
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
            '@id': `${baseUrl}/#organization`,
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

        // 提取 FAQ
        const markdownContent = post.markdownContent || ''
        const faqs = extractFaqFromContent(markdownContent)

        const schemas: Record<string, unknown>[] = [
          {
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
              '@id': `${baseUrl}/#organization`,
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
            keywords: post.categories?.map(cat => cat.title).join(', ') || '',
            speakable: {
              '@type': 'SpeakableSpecification',
              cssSelector: ['.article-headline', '.article-summary']
            }
          }
        ]

        // 有 FAQ 时添加 FAQPage schema
        if (faqs.length > 0) {
          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              }
            }))
          })
        }

        return schemas

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

  // article 类型返回多个 schema
  if (Array.isArray(jsonLd)) {
    return (
      <>
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </>
    )
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
