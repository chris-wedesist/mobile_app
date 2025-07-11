import { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redisClient = new Redis(process.env.REDIS_URL);

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_attempt',
  points: 5, // 5 attempts
  duration: 60 * 15, // per 15 minutes
});

export const checkRateLimit = async (identifier: string): Promise<boolean> => {
  try {
    await rateLimiter.consume(identifier);
    return true;
  } catch (error) {
    return false;
  }
};