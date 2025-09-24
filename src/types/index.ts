export interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  excerpt?: string
  publishedAt: string
  mainImage?: {
    asset: {
      _ref: string
    }
    alt?: string
    customUrl?: string // 新增：自定义图片URL
  }
  mainImageUrl?: string // 新增：直接图片URL字段
  body?: Record<string, unknown>[]
  markdownContent?: string // 新增：markdown原始内容
  author?: Author
  categories?: Category[]
}

export interface Author {
  name: string
  image?: {
    asset: {
      _ref: string
    }
  }
  bio?: Record<string, unknown>[]
}

export interface Category {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
}

export interface SiteSettings {
  title: string
  heroTitle: string
  heroSubtitle?: string
  footerDescription?: string
  email?: string
  github?: string
  twitter?: string
  copyrightText?: string
}