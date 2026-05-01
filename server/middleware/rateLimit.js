// 简易内存频率限制中间件，不引入额外依赖
const windowMs = 60 * 1000 // 1 分钟窗口

const stores = {}

export function rateLimit({ max = 30, keyFn = (req) => req.ip } = {}) {
  return (req, res, next) => {
    const key = keyFn(req)
    const now = Date.now()

    if (!stores[key]) {
      stores[key] = { count: 1, resetAt: now + windowMs }
      return next()
    }

    const store = stores[key]

    if (now > store.resetAt) {
      store.count = 1
      store.resetAt = now + windowMs
      return next()
    }

    store.count++

    if (store.count > max) {
      return res.status(429).json({ ok: false, error: 'Too many requests, slow down.' })
    }

    next()
  }
}

// 定期清理过期记录，避免内存泄漏
setInterval(() => {
  const now = Date.now()
  for (const key of Object.keys(stores)) {
    if (now > stores[key].resetAt) {
      delete stores[key]
    }
  }
}, 5 * 60 * 1000)
