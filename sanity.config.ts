import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

// 检查是否为开发环境或管理员模式
const isDev = process.env.NODE_ENV === 'development'
const isAdminMode = process.env.SANITY_ADMIN_MODE === 'true' || isDev

export default defineConfig({
  name: 'default',
  title: `个人博客${isAdminMode ? ' - 管理员模式 🔓' : ''}`,

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w7iihdoh',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .id('root')
          .title('内容管理中心')
          .items([
            // 管理员模式提示
            ...(isAdminMode ? [
              S.listItem()
                .id('admin-mode-notice')
                .title('🔓 管理员模式已启用')
                .child(
                  S.list()
                    .id('admin-functions')
                    .title('管理员功能')
                    .items([
                      S.listItem()
                        .id('delete-enabled')
                        .title('🗑️ 可以删除内容')
                        .child(S.documentTypeList('post').title('删除功能已启用')),
                      S.listItem()
                        .id('publish-enabled')
                        .title('✅ 可以发布/取消发布')
                        .child(S.documentTypeList('category').title('发布功能已启用')),
                      S.listItem()
                        .id('duplicate-enabled')
                        .title('📋 可以复制内容')
                        .child(S.documentTypeList('author').title('复制功能已启用')),
                    ])
                ),
              S.divider(),
            ] : []),
            // 快速操作区域
            S.listItem()
              .id('quick-actions')
              .title('🚀 快速操作')
              .child(
                S.list()
                  .id('quick-create')
                  .title('快速创建')
                  .items([
                    S.listItem()
                      .id('create-post')
                      .title('📝 新建文章')
                      .child(S.documentTypeList('post').title('新建文章')),
                    S.listItem()
                      .id('create-category')
                      .title('🗂️ 新建分类')
                      .child(S.documentTypeList('category').title('新建分类')),
                    S.listItem()
                      .id('create-author')
                      .title('👤 新建作者')
                      .child(S.documentTypeList('author').title('新建作者')),
                  ])
              ),
            S.divider(),
            // 内容管理区域
            S.listItem()
              .id('posts-management')
              .title('📄 博客文章')
              .child(S.documentTypeList('post').title('文章管理')),
            S.listItem()
              .id('categories-management')
              .title('🏷️ 分类管理')
              .child(S.documentTypeList('category').title('分类管理')),
            S.listItem()
              .id('authors-management')
              .title('👥 作者管理')
              .child(S.documentTypeList('author').title('作者管理')),
            S.divider(),
            // 设置区域
            S.listItem()
              .id('site-settings')
              .title('⚙️ 网站设置')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
                  .title('网站设置')
              )
          ])
    }),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },

  // 根据管理员模式强制启用/禁用操作
  document: {
    actions: (prev, context) => {
      if (!isAdminMode) {
        // 非管理员模式：只保留基础操作
        return prev.filter(action =>
          ['create', 'update', 'publish'].includes(action.action || '')
        )
      }

      // 管理员模式：启用所有操作
      return prev.map(action => {
        // 删除操作
        if (action.action === 'delete') {
          return {
            ...action,
            disabled: false,
            title: '🗑️ 删除此项',
            tone: 'critical'
          }
        }
        // 发布操作
        if (action.action === 'publish') {
          return {
            ...action,
            disabled: false,
            title: '✅ 发布内容',
            tone: 'positive'
          }
        }
        // 取消发布操作
        if (action.action === 'unpublish') {
          return {
            ...action,
            disabled: false,
            title: '📝 取消发布',
            tone: 'caution'
          }
        }
        // 复制操作
        if (action.action === 'duplicate') {
          return {
            ...action,
            disabled: false,
            title: '📋 复制内容'
          }
        }
        return action
      })
    }
  },

  // 工具配置
  tools: (prev) => {
    if (isAdminMode) {
      console.log('🔓 Sanity管理员模式已启用，删除功能可用')
    }
    return prev
  }
})