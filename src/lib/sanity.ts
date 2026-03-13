import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true, // 启用CDN缓存，配合ISR使用
  apiVersion: '2024-01-01',
})

export const cdnClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true, // 启用CDN缓存，加速搜索等不需要实时性的查询
  apiVersion: '2024-01-01',
})

const builder = imageUrlBuilder(client)

export const urlFor = (source: Record<string, unknown>) => {
  return builder.image(source)
}