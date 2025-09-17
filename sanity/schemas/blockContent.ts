import { defineType, defineArrayMember } from 'sanity'

export default defineType({
  title: '内容块',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: '块',
      type: 'block',
      styles: [
        { title: '正文', value: 'normal' },
        { title: '标题1', value: 'h1' },
        { title: '标题2', value: 'h2' },
        { title: '标题3', value: 'h3' },
        { title: '标题4', value: 'h4' },
        { title: '引用', value: 'blockquote' },
      ],
      lists: [
        { title: '项目符号', value: 'bullet' },
        { title: '数字', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: '加粗', value: 'strong' },
          { title: '斜体', value: 'em' },
          { title: '下划线', value: 'underline' },
          { title: '删除线', value: 'strike-through' },
          { title: '代码', value: 'code' },
        ],
        annotations: [
          {
            title: '链接',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: '链接',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
    }),
  ],
})