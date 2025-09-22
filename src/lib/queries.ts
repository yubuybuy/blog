import { client } from './sanity'

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

export async function getPosts() {
  const query = `
    *[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
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
    // 确保返回数组，即使没有文章
    return posts || []
  } catch (error) {
    console.error('获取文章失败:', error)
    return []
  }
}

export async function getPost(slug: string) {
  const query = `
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
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
    *[_type == "post" && references(*[_type == "category" && slug.current == $categorySlug]._id)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
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
    *[_type == "post" && (title match $searchQuery || excerpt match $searchQuery)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
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

  return await client.fetch(query, { searchQuery: `${searchQuery}*` })
}