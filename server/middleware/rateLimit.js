// 简易内存频率限制中间件
// 注意：此实现仅适用于单进程/单机部署，水平扩展时需替换为 Redis 方案
const DEFAULT_WINDOW_MS = 60 * 1000 // 1 分钟窗口

const stores = {}

/**
 * @param {Object} options
 * @param {number} options.max - 窗口内最大请求数
 * @param {number} options.windowMs - 时间窗口（毫秒）
 * @param {Function} options.keyFn - 自定义 key 生成函数，默认取客户端 IP
 * @returns {Function} Express 中间件
 */
export function rateLimit({ max = 30, windowMs = DEFAULT_WINDOW_MS, keyFn } = {}) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : getClientIP(req)
    const now = Date.now()

    if (!stores[key]) {
      stores[key] = { count: 1, resetAt: now + windowMs }
      setRateLimitHeaders(res, max, max - 1, stores[key].resetAt)
      return next()
    }

    const store = stores[key]

    // 窗口过期，重置计数
    if (now > store.resetAt) {
      store.count = 1
      store.resetAt = now + windowMs
      setRateLimitHeaders(res, max, max - 1, store.resetAt)
      return next()
    }

    store.count++
    const remaining = Math.max(0, max - store.count)
    setRateLimitHeaders(res, max, remaining, store.resetAt)

    if (store.count > max) {
      return res.status(429).json({
        ok: false,
        error: 'Too many requests, slow down.',
        retryAfter: Math.ceil((store.resetAt - now) / 1000),
      })
    }

    next()
  }
}

/**
 * 获取客户端真实 IP（优先取 X-Forwarded-For，适配反向代理）
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    // X-Forwarded-For 可能包含多个 IP（逗号分隔），取第一个
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

/**
 * 设置标准限流响应头
 */
function setRateLimitHeaders(res, limit, remaining, resetAt) {
  res.setHeader('X-RateLimit-Limit', limit)
  res.setHeader('X-RateLimit-Remaining', remaining)
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000))
}

// 定期清理过期记录，避免内存泄漏
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const key of Object.keys(stores)) {
    if (now > stores[key].resetAt) {
      delete stores[key]
    }
  }
}, CLEANUP_INTERVAL_MS)
