import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'default',
  title: '个人博客',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w7iihdoh',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [
    structureTool(),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },

  // 启用删除功能
  document: {
    actions: (prev, context) => {
      return prev.map((originalAction) => {
        if (originalAction.action === 'delete') {
          return {
            ...originalAction,
            disabled: false
          }
        }
        return originalAction
      })
    }
  }
})