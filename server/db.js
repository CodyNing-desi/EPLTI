import mysql from 'mysql2/promise'

let pool = null

/**
 * 初始化数据库：创建数据库（如果不存在）+ 建表
 */
export async function initDB() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

  // 1. 先用无数据库的连接创建目标数据库
  const tmpConn = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 3306,
    user: DB_USER || 'root',
    password: DB_PASSWORD || '',
  })

  await tmpConn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME || 'eplti'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await tmpConn.end()

  // 2. 创建连接池
  pool = mysql.createPool({
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 3306,
    user: DB_USER || 'root',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'eplti',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  })

  // 3. 自动建表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id            INT           AUTO_INCREMENT PRIMARY KEY,
      type_code     VARCHAR(16)   NOT NULL COMMENT '人格类型代码',
      runner_up     VARCHAR(16)   DEFAULT NULL COMMENT '次优匹配类型',
      detected_team VARCHAR(8)    DEFAULT NULL COMMENT '检测到的主队',
      answers       JSON          DEFAULT NULL COMMENT '答案数组 JSON',
      created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_type_code (type_code),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  console.log('✅ Database initialized (MySQL)')
}

/**
 * 获取连接池
 */
export function getPool() {
  if (!pool) throw new Error('Database not initialized. Call initDB() first.')
  return pool
}
