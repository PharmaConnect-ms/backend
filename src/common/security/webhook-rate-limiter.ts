/**
 * WEBHOOK RATE LIMITER - POLICY: C. Webhook Security (Zoom)
 * Rate-limits webhook payloads to prevent abuse
 * Meets requirement: "Webhook payload SHOULD be rate-limited"
 */

import { BadRequestException } from '@nestjs/common';

export interface RateLimitConfig {
  /** Maximum requests per time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** If true, block request; if false, just log */
  blockOnExceed: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class WebhookRateLimiter {
  private static entries: Map<string, RateLimitEntry> = new Map();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the rate limiter (optional, for cleanup)
   */
  static initialize(): void {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.entries.entries()) {
        if (entry.resetTime < now) {
          this.entries.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Cleanup when shutting down
   */
  static destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.entries.clear();
  }

  /**
   * Check rate limit for a given key
   * @param key Identifier (e.g., IP address, user ID, webhook source)
   * @param config Rate limit configuration
   * @param logWarning Optional: log when rate limit is exceeded
   * @returns { allowed: boolean, remaining: number, resetTime: Date }
   */
  static checkLimit(
    key: string,
    config: RateLimitConfig,
    logWarning: (msg: string) => void = console.warn,
  ): { allowed: boolean; remaining: number; resetTime: Date } {
    const now = Date.now();
    let entry = this.entries.get(key);

    // Create new entry if it doesn't exist or is expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.entries.set(key, entry);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(entry.resetTime),
      };
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTime = new Date(entry.resetTime);

    if (!allowed) {
      const message = `Rate limit exceeded for ${key}. Reset at ${resetTime.toISOString()}`;
      logWarning(`[Webhook Security] ${message}`);

      if (config.blockOnExceed) {
        throw new BadRequestException(
          'Too many webhook requests. Please try again later.',
        );
      }
    }

    return { allowed, remaining, resetTime };
  }

  /**
   * Pre-configured rate limits for different scenarios
   */
  static readonly PRESETS = {
    // Strict: 10 requests per minute per IP
    STRICT: {
      maxRequests: 10,
      windowMs: 60000,
      blockOnExceed: true,
    },
    // Normal: 100 requests per minute per source
    NORMAL: {
      maxRequests: 100,
      windowMs: 60000,
      blockOnExceed: true,
    },
    // Relaxed: 1000 requests per hour per source
    RELAXED: {
      maxRequests: 1000,
      windowMs: 3600000,
      blockOnExceed: false,
    },
  };
}
