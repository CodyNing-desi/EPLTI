import pkg from 'pg'
const { Pool } = pkg

let pool = null

/**
 * 初始化数据库：自动建表
 */
export async function initDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  // 自动建表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id            SERIAL        PRIMARY KEY,
      type_code     VARCHAR(16)   NOT NULL,
      runner_up     VARCHAR(16)   DEFAULT NULL,
      detected_team VARCHAR(8)    DEFAULT NULL,
      answers       JSONB         DEFAULT NULL,
      created_at    TIMESTAMPTZ   DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_type_code ON quiz_results (type_code)
  `)

  console.log('✅ Database initialized (PostgreSQL)')
}

/**
 * 获取连接池
 */
export function getPool() {
  if (!pool) throw new Error('Database not initialized. Call initDB() first.')
  return pool
}
