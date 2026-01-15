import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'default',
  title: '个人博客 - 开发环境',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: 'development', // 使用开发数据集，删除权限更宽松

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('内容管理')
          .items([
            S.listItem()
              .title('🚀 快速操作')
              .child(
                S.list()
                  .title('快速操作')
                  .items([
                    S.listItem()
                      .title('📝 创建文章')
                      .child(S.documentTypeList('post').title('所有文章').canHandleIntent(S.documentTypeList('post').getCanHandleIntent())),
                    S.listItem()
                      .title('🗂️ 创建分类')
                      .child(S.documentTypeList('category').title('所有分类')),
                    S.listItem()
                      .title('👤 创建作者')
                      .child(S.documentTypeList('author').title('所有作者')),
                  ])
              ),
            S.divider(),
            S.listItem()
              .title('📄 博客文章')
              .child(S.documentTypeList('post').title('文章管理')),
            S.listItem()
              .title('🏷️ 分类管理')
              .child(S.documentTypeList('category').title('分类管理')),
            S.listItem()
              .title('👥 作者管理')
              .child(S.documentTypeList('author').title('作者管理')),
            S.divider(),
            S.listItem()
              .title('⚙️ 网站设置')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings'))
          ])
    }),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },

  // 强制启用所有操作，包括删除
  document: {
    actions: (prev) => prev
  },

  // 开发模式设置
  tools: (prev, context) => {
    // 添加自定义工具或修改现有工具
    return prev
  }
})