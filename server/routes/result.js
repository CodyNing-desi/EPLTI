import { Router } from 'express'
import { getPool } from '../db.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()

// POST 接口严格限频，防止刷数据
const strictLimit = rateLimit({ max: 10 })

const VALID_TYPES = new Set([
  'ZERO', 'WENGER', 'CTRL', 'SAF', 'QHI', 'M', 'HOLD', 'RIDE',
  'CAPS', 'REF', 'LOL', 'XXXX', 'CLOUD', 'FREE',
])

router.post('/result', strictLimit, async (req, res) => {
  try {
    const { type_code, runner_up, detected_team, answers } = req.body
    if (!type_code || !VALID_TYPES.has(type_code)) {
      return res.status(400).json({ ok: false, error: 'Invalid type_code' })
    }
    const pool = getPool()
    const [resultInfo] = await pool.execute(
      `INSERT INTO quiz_results (type_code, runner_up, detected_team, answers) VALUES (?, ?, ?, ?)`,
      [type_code, runner_up || null, detected_team || null, answers ? JSON.stringify(answers) : null]
    )
    const stats = await queryStats(pool)
    res.json({ ok: true, id: resultInfo.insertId, stats })
  } catch (err) {
    console.error('POST /api/result error:', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

router.get('/result/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!id || isNaN(Number(id))) return res.status(400).json({ ok: false, error: 'Invalid id' })
    const pool = getPool()
    const [rows] = await pool.execute(`SELECT * FROM quiz_results WHERE id = ?`, [id])
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Result not found' })
    const result = rows[0]
    res.json({
      ok: true,
      data: {
        type_code: result.type_code,
        runner_up: result.runner_up,
        detected_team: result.detected_team,
        answers: result.answers ? (typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers) : null
      }
    })
  } catch (err) {
    console.error('GET /api/result/:id error:', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

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

async function queryStats(pool) {
  const [rows] = await pool.execute(
    `SELECT type_code, COUNT(*) AS count FROM quiz_results GROUP BY type_code`
  )
  const total = rows.reduce((sum, r) => sum + Number(r.count), 0)
  const types = {}
  for (const code of VALID_TYPES) types[code] = { count: 0, percentage: 0 }
  for (const row of rows) {
    types[row.type_code] = {
      count: Number(row.count),
      percentage: total > 0 ? Math.round((Number(row.count) / total) * 1000) / 10 : 0,
    }
  }
  return { total, types }
}

export default router
