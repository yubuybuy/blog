import { defineConfig } from 'sanity'

const projectId = 'w7iihdoh'
const dataset = 'production'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId,
  dataset,
  // 其他配置...
})