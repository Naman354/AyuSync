import Redis from 'ioredis';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    const isTls = REDIS_URL.startsWith('rediss://');

    redisClient = new Redis(REDIS_URL, {
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      family: 4, // Ensure IPv4 compatibility for Render & Upstash
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Connection failed after 3 retries; falling back to in-memory mode.');
          return null;
        }
        return Math.min(times * 200, 1000);
      }
    });

    redisClient.connect().then(() => {
      isRedisAvailable = true;
      console.log(`[Redis] Connected successfully to Redis/Upstash instance.`);
    }).catch((err) => {
      console.warn(`[Redis] Initial connection failed (${err.message}). Continuing in fallback mode.`);
      isRedisAvailable = false;
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
      isRedisAvailable = false;
    });
  } catch (err: any) {
    console.warn('[Redis] Initialization error:', err.message);
  }
} else {
  console.log('[Redis] No REDIS_URL configured. Running in standalone in-memory mode.');
}

export const getRedisClient = () => (isRedisAvailable ? redisClient : null);
export const hasRedis = () => isRedisAvailable;
