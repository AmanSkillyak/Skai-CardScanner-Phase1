import { NextFunction, Request, Response } from 'express';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '../constants';
import { createError } from '../utils/apiError';

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

export const rateLimit = (req: Request, _res: Response, next: NextFunction): void => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  existing.count += 1;

  if (existing.count > RATE_LIMIT_MAX) {
    next(createError(429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.'));
    return;
  }

  next();
};
