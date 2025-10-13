// 测试百度推送功能
import fs from 'fs'

// 读取环境变量
const envLocal = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envLocal.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, value] = line.split('=')
    envVars[key.trim()] = value.trim()
  }
})

const token = envVars.BAIDU_PUSH_TOKEN
const site = envVars.NEXT_PUBLIC_BASE_URL || 'https://www.sswl.top'

async function testBaiduPush() {
  try {
    console.log('🚀 开始测试百度推送...')
    console.log(`站点: ${site}`)

    // 测试推送首页
    const testUrls = [
      `${site}/`,
      `${site}/posts`,
    ]

    console.log(`\n📤 推送以下URL:`)
    testUrls.forEach(url => console.log(`  - ${url}`))

    const pushUrl = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`

    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: testUrls.join('\n'),
    })

    const result = await response.json()

    console.log('\n✅ 推送结果:')
    console.log(JSON.stringify(result, null, 2))

    if (result.success !== undefined) {
      console.log(`\n✅ 成功推送: ${result.success} 条`)
      console.log(`📊 剩余配额: ${result.remain} 条`)
    }

  } catch (error) {
    console.error('❌ 推送失败:', error)
  }
}

testBaiduPush()
