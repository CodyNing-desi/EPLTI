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
    const { type_code, runner_up, detected_team, answers, normalized, gameweek } = req.body
    if (!type_code || !VALID_TYPES.has(type_code)) {
      return res.status(400).json({ ok: false, error: 'Invalid type_code' })
    }
    const pool = getPool()
    
    const scores = normalized || {}
    const [resultInfo] = await pool.execute(
      `INSERT INTO quiz_results (type_code, runner_up, detected_team, answers, score_t, score_e, score_s, score_k, score_r, gameweek) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type_code, 
        runner_up || null, 
        detected_team || null, 
        answers ? JSON.stringify(answers) : null,
        scores.T || 0,
        scores.E || 0,
        scores.S || 0,
        scores.K || 0,
        scores.R || 0,
        gameweek || 0
      ]
    )

    // 异步更新统计大盘 (Season Mood Index)
    if (detected_team && gameweek) {
      updateSeasonStats(pool, gameweek, detected_team).catch(console.error)
    }

    const stats = await queryStats(pool)
    res.json({ ok: true, id: resultInfo.insertId, stats })
  } catch (err) {
    console.error('POST /api/result error:', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

/**
 * 聚合更新赛季统计大盘
 */
async function updateSeasonStats(pool, gameweek, team) {
  const [rows] = await pool.execute(
    `SELECT 
      AVG(score_t) as avg_t, 
      AVG(score_e) as avg_e, 
      AVG(score_s) as avg_s, 
      AVG(score_k) as avg_k, 
      AVG(score_r) as avg_r, 
      COUNT(*) as sample_size 
     FROM quiz_results 
     WHERE gameweek = ? AND detected_team = ?`,
    [gameweek, team]
  )
  
  if (rows.length > 0) {
    const s = rows[0]
    await pool.execute(
      `INSERT INTO season_stats (gameweek, detected_team, avg_t, avg_e, avg_s, avg_k, avg_r, sample_size) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       avg_t=VALUES(avg_t), avg_e=VALUES(avg_e), avg_s=VALUES(avg_s), avg_k=VALUES(avg_k), avg_r=VALUES(avg_r), sample_size=VALUES(sample_size)`,
      [gameweek, team, s.avg_t, s.avg_e, s.avg_s, s.avg_k, s.avg_r, s.sample_size]
    )
  }
}

// GET /api/season-mood - 获取赛季情绪指数趋势
router.get('/season-mood', async (req, res) => {
  try {
    const { team } = req.query
    const pool = getPool()
    let query = `SELECT * FROM season_stats`
    let params = []
    
    if (team) {
      query += ` WHERE detected_team = ?`
      params.push(team)
    }
    
    query += ` ORDER BY gameweek ASC`
    const [rows] = await pool.execute(query, params)
    res.json({ ok: true, data: rows })
  } catch (err) {
    console.error('GET /api/season-mood error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ADMIN: 导出原始数据（用于证明项目真实性，申请激励计划）
router.get('/admin/export', rateLimit({ max: 5 }), async (req, res) => {
  const adminKey = req.query.key || req.headers['x-admin-key']
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const pool = getPool()
    const [rows] = await pool.execute(`SELECT * FROM quiz_results ORDER BY created_at DESC LIMIT 1000`)
    res.json({ count: rows.length, data: rows })
  } catch (err) {
    res.status(500).json({ error: 'Export failed' })
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
        answers: result.answers ? (typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers) : null,
        gameweek: result.gameweek,
        scores: {
          T: Number(result.score_t),
          E: Number(result.score_e),
          S: Number(result.score_s),
          K: Number(result.score_k),
          R: Number(result.score_r)
        }
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
