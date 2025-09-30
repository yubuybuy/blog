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
          '/sanity/'
        ],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}