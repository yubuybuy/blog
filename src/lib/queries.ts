import { client, cdnClient } from './sanity'

// 获取网站设置
export async function getSiteSettings() {
  const query = `
    *[_type == "siteSettings"][0] {
      title,
      heroTitle,
      heroSubtitle,
      footerDescription,
      email,
      github,
      twitter,
      copyrightText
    }
  `

  return await client.fetch(query)
}

// 获取网站名称的辅助函数
export async function getSiteName(): Promise<string> {
  const settings = await getSiteSettings()
  return settings?.title || 'USEIT库'
}

export async function getPosts() {
  const query = `
    *[_type == "post" && !defined(deleted)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      mainImageUrl,
      author->{
        name,
        image
      },
      categories[]->{
        title,
        slug
      }
    }
  `

  try {
    const posts = await client.fetch(query)
    return posts || []
  } catch (error) {
    console.error('获取文章失败:', error)
    return []
  }
}

// 分页获取文章
export async function getPostsPaginated(page: number = 1, pageSize: number = 12) {
  const start = (page - 1) * pageSize
  const end = start + pageSize

  const query = `{
    "posts": *[_type == "post" && !defined(deleted)] | order(publishedAt desc) [$start...$end] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      mainImageUrl,
      author->{
        name,
        image
      },
      categories[]->{
        title,
        slug
      }
    },
    "total": count(*[_type == "post" && !defined(deleted)])
  }`

  try {
    const result = await client.fetch(query, { start, end })
    return { posts: result.posts || [], total: result.total || 0 }
  } catch (error) {
    console.error('获取文章失败:', error)
    return { posts: [], total: 0 }
  }
}

export async function getPost(slug: string) {
  const query = `
    *[_type == "post" && slug.current == $slug && !defined(deleted)][0] {
      _id,
      _updatedAt,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      mainImageUrl,
      body,
      markdownContent,
      author->{
        name,
        image,
        bio
      },
      categories[]->{
        title,
        slug
      }
    }
  `

  return await client.fetch(query, { slug })
}

export async function getCategories() {
  const query = `
    *[_type == "category"] | order(title asc) {
      _id,
      title,
      slug,
      description
    }
  `

  return await client.fetch(query)
}

export async function getPostsByCategory(categorySlug: string) {
  const query = `
    *[_type == "post" && !defined(deleted) && references(*[_type == "category" && slug.current == $categorySlug]._id)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      mainImageUrl,
      author->{
        name,
        image
      },
      categories[]->{
        title,
        slug
      }
    }
  `

  return await client.fetch(query, { categorySlug })
}

export async function searchPosts(searchQuery: string) {
  const query = `
    *[_type == "post" && !defined(deleted) && (title match $searchQuery || excerpt match $searchQuery)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      mainImageUrl,
      author->{
        name,
        image
      },
      categories[]->{
        title,
        slug
      }
    }
  `

  return await cdnClient.fetch(query, { searchQuery: `${searchQuery}*` })
}