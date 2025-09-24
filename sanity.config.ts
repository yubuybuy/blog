import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'default',
  title: '个人博客管理后台',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w7iihdoh',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [
    structureTool(),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },

  // 确保删除功能启用
  document: {
    actions: (prev, context) => {
      console.log('🔧 配置文档操作:', prev.map(a => a.action))

      return prev.map((originalAction) => {
        if (originalAction.action === 'delete') {
          console.log('🗑️ 启用删除功能')
          return {
            ...originalAction,
            disabled: false,
            title: '删除',
            shortcut: 'mod+alt+d'
          }
        }
        return originalAction
      })
    }
  }
})