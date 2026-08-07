const Redis = require('ioredis');

let redisClient = null;
const inMemoryLocks = new Map();

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null, // Don't hang indefinitely if Redis is down
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      // Suppress spammy log output if Redis is not installed locally
    });
  }
  return redisClient;
};

// Distributed Lock Implementation with Graceful In-Memory Fallback
const acquireLock = async (lockKey, ttlSeconds = 300) => {
  try {
    const redis = getRedisClient();
    const lockValue = `lock_${Date.now()}_${Math.random()}`;
    const result = await redis.set(lockKey, lockValue, 'EX', ttlSeconds, 'NX');
    if (result === 'OK') {
      return lockValue;
    }
    return null;
  } catch (err) {
    // Fallback: In-memory lock mechanism
    const lockValue = `lock_${Date.now()}_${Math.random()}`;
    if (!inMemoryLocks.has(lockKey)) {
      inMemoryLocks.set(lockKey, lockValue);
      setTimeout(() => inMemoryLocks.delete(lockKey), ttlSeconds * 1000);
      return lockValue;
    }
    return null;
  }
};

const releaseLock = async (lockKey, lockValue) => {
  try {
    const redis = getRedisClient();
    const currentValue = await redis.get(lockKey);
    if (currentValue === lockValue) {
      await redis.del(lockKey);
      return true;
    }
    return false;
  } catch (err) {
    if (inMemoryLocks.get(lockKey) === lockValue) {
      inMemoryLocks.delete(lockKey);
      return true;
    }
    return false;
  }
};

// Virtual Queue Implementation with Graceful Fallback
const addToQueue = async (queueName, userId) => {
  try {
    const redis = getRedisClient();
    const score = Date.now();
    await redis.zadd(queueName, score, userId);
    const rank = await redis.zrank(queueName, userId);
    return rank + 1;
  } catch (err) {
    return 1;
  }
};

const getQueuePosition = async (queueName, userId) => {
  try {
    const redis = getRedisClient();
    const rank = await redis.zrank(queueName, userId);
    if (rank === null) return null;
    return rank + 1;
  } catch (err) {
    return null;
  }
};

const removeFromQueue = async (queueName, userId) => {
  try {
    const redis = getRedisClient();
    await redis.zrem(queueName, userId);
  } catch (err) {}
};

const getQueueLength = async (queueName) => {
  try {
    const redis = getRedisClient();
    return await redis.zcard(queueName);
  } catch (err) {
    return 0; // Return 0 length if Redis is inactive (direct checkout)
  }
};

module.exports = {
  getRedisClient,
  acquireLock,
  releaseLock,
  addToQueue,
  getQueuePosition,
  removeFromQueue,
  getQueueLength,
};
