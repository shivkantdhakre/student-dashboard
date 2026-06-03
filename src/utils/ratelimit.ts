import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Limit to 10 requests per 60 seconds
    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    });
  } catch (error) {
    console.error('Failed to initialize Upstash Redis Client:', error);
  }
} else {
  console.warn(
    'Warning: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing in env. Rate limiting is disabled.'
  );
}

export async function isRateLimited(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!ratelimiter) {
    // If not configured, default to success: true to degrade gracefully in dev
    return {
      success: true,
      limit: 10,
      remaining: 10,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await ratelimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Upstash Redis Rate Limit failure, allowing request:', error);
    return {
      success: true,
      limit: 10,
      remaining: 10,
      reset: Date.now() + 60000,
    };
  }
}
