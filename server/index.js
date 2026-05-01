import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import resultRoutes from './routes/result.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 80

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
}))
app.use(express.json())

// API 路由
app.use('/api', resultRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 托管前端静态文件 (打包后的 client/dist)
app.use(express.static(path.join(__dirname, '../client/dist')))

// SPA 路由 fallback：所有非 API 请求都返回 index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
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
