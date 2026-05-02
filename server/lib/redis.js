import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;

if (process.env.USE_REDIS === 'true') {
  redisClient = createClient({
    url: redisUrl
  });

  redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
  
  // 自启动连接
  (async () => {
    try {
      await redisClient.connect();
      console.log('✅ Connected to Redis');
    } catch (err) {
      console.error('❌ Failed to connect to Redis, caching will be disabled.');
      redisClient = null;
    }
  })();
}

/**
 * 获取缓存
 */
export async function getCache(key) {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
}

/**
 * 设置缓存
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 过期时间（秒），默认一周 (3600 * 24 * 7)
 */
export async function setCache(key, value, ttlSeconds = 604800) {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  } catch (err) {
    console.error('Redis set error:', err);
  }
}

export default redisClient;
