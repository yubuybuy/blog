import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'default',
  title: '个人博客 - 管理员模式 🔓',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w7iihdoh',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [
    structureTool(),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },

  // 强制启用所有操作，包括删除
  document: {
    actions: (prev, context) => {
      // 确保删除操作总是存在且可用
      const actions = prev.map(action => {
        if (action.action === 'delete') {
          return {
            ...action,
            disabled: false,
            title: '🗑️ 删除',
            tone: 'critical'
          }
        }
        return action
      })

      // 如果没有找到删除操作，手动添加一个
      const hasDelete = actions.some(action => action.action === 'delete')
      if (!hasDelete) {
        actions.push({
          action: 'delete',
          disabled: false,
          title: '🗑️ 删除',
          tone: 'critical'
        })
      }

      return actions
    }
  }
})