import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: '网站设置',
  type: 'document',
  __experimental_actions: [
    // 只允许创建和更新，不允许删除和复制
    'create',
    'update',
    'publish'
  ],
  fields: [
    defineField({
      name: 'title',
      title: '网站标题',
      type: 'string',
      description: '显示在浏览器标签和网站顶部的标题',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroTitle',
      title: '首页大标题',
      type: 'string',
      description: '首页显示的主要标题',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: '首页副标题',
      type: 'text',
      rows: 3,
      description: '首页标题下方的介绍文字',
    }),
    defineField({
      name: 'footerDescription',
      title: '底部介绍',
      type: 'text',
      rows: 3,
      description: '网站底部的介绍文字',
    }),
    defineField({
      name: 'email',
      title: '联系邮箱',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'github',
      title: 'GitHub链接',
      type: 'url',
      description: '你的GitHub主页链接',
    }),
    defineField({
      name: 'twitter',
      title: 'Twitter链接',
      type: 'url',
      description: '你的Twitter主页链接',
    }),
    defineField({
      name: 'copyrightText',
      title: '版权文字',
      type: 'string',
      description: '底部版权信息',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'heroTitle',
    },
  },
})