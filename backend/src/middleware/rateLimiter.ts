import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface RateLimitData {
  count: number;
  expiresAt: number;
}

const cache = new Map<string, RateLimitData>();

/**
 * In-memory rate limiter middleware.
 * Limits requests per user/IP within a sliding time window.
 */
export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const identifier = (req.headers['x-user-id'] as string) || req.ip || 'anonymous';
    const key = `rate_limit:${identifier}`;
    const now = Date.now();

    let record = cache.get(key);

    if (!record || record.expiresAt < now) {
      // First request or expired
      record = {
        count: 1,
        expiresAt: now + env.RATE_LIMIT_WINDOW_MS,
      };
      cache.set(key, record);
    } else {
      record.count += 1;
    }

    const current = record.count;
    const ttl = Math.max(0, record.expiresAt - now);

    res.setHeader('X-RateLimit-Limit', env.RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, env.RATE_LIMIT_MAX_REQUESTS - current));

    if (current > env.RATE_LIMIT_MAX_REQUESTS) {
      res.setHeader('Retry-After', Math.ceil(ttl / 1000));
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.',
        retryAfterMs: ttl,
      });
      return;
    }

    next();
  } catch (err) {
    logger.warn('Rate limiter failed, allowing request through', err);
    next();
  }
}
