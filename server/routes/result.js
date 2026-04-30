import { Router } from 'express'
import { getPool } from '../db.js'

const router = Router()

// 14 种合法的人格类型代码
const VALID_TYPES = new Set([
  'ZERO', 'WENGER', 'CTRL', 'SAF', 'QHI', 'M', 'HOLD', 'RIDE',
  'CAPS', 'REF', 'LOL', 'XXXX', 'CLOUD', 'FREE',
])

/**
 * POST /api/result — 提交测试结果
 */
router.post('/result', async (req, res) => {
  try {
    const { type_code, runner_up, detected_team, answers } = req.body

    if (!type_code || !VALID_TYPES.has(type_code)) {
      return res.status(400).json({ ok: false, error: 'Invalid type_code' })
    }

    const pool = getPool()

    await pool.query(
      `INSERT INTO quiz_results (type_code, runner_up, detected_team, answers)
       VALUES ($1, $2, $3, $4)`,
      [
        type_code,
        runner_up || null,
        detected_team || null,
        answers ? JSON.stringify(answers) : null,
      ]
    )

    const stats = await queryStats(pool)
    res.json({ ok: true, stats })
  } catch (err) {
    console.error('POST /api/result error:', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/stats — 获取人格类型统计
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool()
    const stats = await queryStats(pool)
    res.json(stats)
  } catch (err) {
    console.error('GET /api/stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * 查询统计数据
 */
async function queryStats(pool) {
  const { rows } = await pool.query(
    `SELECT type_code, COUNT(*)::int AS count FROM quiz_results GROUP BY type_code`
  )

  const total = rows.reduce((sum, r) => sum + r.count, 0)
  const types = {}

  for (const code of VALID_TYPES) {
    types[code] = { count: 0, percentage: 0 }
  }

  for (const row of rows) {
    types[row.type_code] = {
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
    }
  }

  return { total, types }
}

export default router
