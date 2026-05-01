import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import resultRoutes from './routes/result.js'
import wechatRoutes from './routes/wechat.js'
import { rateLimit } from './middleware/rateLimit.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 80

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173']

// 中间件
app.use(cors({
  origin: ALLOWED_ORIGINS,
}))
app.use(express.json())

// 全局 API 频率限制
app.use('/api', rateLimit({ max: 60 }))

// API 路由
app.use('/api', resultRoutes)
app.use('/api/wechat', wechatRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 托管前端静态文件 (打包后的 client/dist)
app.use(express.static(path.join(__dirname, '../client/dist')))

// SPA 路由 fallback：所有非 API 请求都返回 index.html
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    const htmlPath = path.join(__dirname, '../client/dist/index.html')
    
    // 如果是分享结果页，注入动态 OG 标签
    if (req.path.startsWith('/result/') && fs.existsSync(htmlPath)) {
      const typeCode = req.path.split('/')[2]
      let html = fs.readFileSync(htmlPath, 'utf8')
      const host = req.get('host') || 'localhost'
      
      const ogTitle = `我是 ${typeCode} 型球迷，你也来测测吧！`
      const ogDesc = `EPLTI - 深度英超球迷人格测试。基于独创的T-E-S-K-R模型。`
      const ogImage = `http://${host}/images/${typeCode}.png` // 对应阶段 6 的插图
      
      const ogTags = `
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="http://${host}${req.originalUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDesc}" />
    <meta name="twitter:image" content="${ogImage}" />`
      
      // 优先用占位符注入 OG 标签（更稳健），fallback 到 </head> 正则
      if (html.includes('<!-- OG_TAGS -->')) {
        html = html.replace('<!-- OG_TAGS -->', ogTags)
      } else {
        html = html.replace(/<\/head\s*>/i, `${ogTags}\n</head>`)
      }
      return res.send(html)
    }

    res.sendFile(htmlPath)
  } else {
    next()
  }
})

// 启动
async function start() {
  try {
    await initDB()
    app.listen(PORT, () => {
      console.log(`🚀 EPLTI Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

start()
