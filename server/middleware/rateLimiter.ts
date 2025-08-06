import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis';

// Different rate limiters for different endpoints
const rateLimiters = {
  auth: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'auth_limit',
    points: 5, // Number of requests
    duration: 900, // Per 15 minutes
    blockDuration: 900, // Block for 15 minutes
  }),

  api: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'api_limit',
    points: 100, // Number of requests
    duration: 60, // Per 1 minute
    blockDuration: 60, // Block for 1 minute
  }),

  telemetry: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'telemetry_limit',
    points: 1000, // Number of requests
    duration: 60, // Per 1 minute
    blockDuration: 60, // Block for 1 minute
  })
};

export const createRateLimiter = (type: keyof typeof rateLimiters) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      await rateLimiters[type].consume(key);
      next();
    } catch (rejRes: any) {
      const remainingPoints = rejRes?.remainingPoints || 0;
      const msBeforeNext = rejRes?.msBeforeNext || 0;

      res.set('Retry-After', Math.round(msBeforeNext / 1000) || 1);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.round(msBeforeNext / 1000) || 1
      });
    }
  };
};