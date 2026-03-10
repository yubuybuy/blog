import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/boss-admin/',
          '/api/',
          '/admin/',
          '/_next/',
          '/studio/',
          '/sanity/',
          '/recycle-bin/',
        ],
      },
      // 明确允许 AI 爬虫
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'cohere-ai', 'Meta-ExternalAgent', 'Bytespider', 'CCBot'],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
