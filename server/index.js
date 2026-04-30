import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDB } from './db.js'
import resultRoutes from './routes/result.js'

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
}))
app.use(express.json())

// 路由
app.use('/api', resultRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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
