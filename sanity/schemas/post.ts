import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: '博客文章',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '文章标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: '文章链接',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: '作者',
      type: 'reference',
      to: { type: 'author' },
    }),
    defineField({
      name: 'mainImage',
      title: '主图',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'mainImageUrl',
      title: '主图URL',
      type: 'url',
      description: '直接使用的图片URL，优先级高于主图'
    }),
    defineField({
      name: 'markdownContent',
      title: 'Markdown内容',
      type: 'text',
      description: '原始markdown格式的文章内容'
    }),
    defineField({
      name: 'categories',
      title: '分类',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'publishedAt',
      title: '发布时间',
      type: 'datetime',
    }),
    defineField({
      name: 'excerpt',
      title: '文章摘要',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'body',
      title: '文章内容',
      type: 'blockContent',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const { author } = selection
      return { ...selection, subtitle: author && `作者: ${author}` }
    },
  },
})