import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting (for production use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  keyGenerator?: (request: NextRequest) => string;
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.',
  keyGenerator: (request) => {
    // Use IP address as default key
    return request.ip || 
           request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }
};

export function createRateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return function rateLimit(request: NextRequest): NextResponse | null {
    const key = config.keyGenerator!(request);
    const now = Date.now();
    
    // Get or create rate limit entry
    let rateLimitEntry = rateLimitMap.get(key);
    
    if (!rateLimitEntry || (now - rateLimitEntry.lastReset) > config.windowMs) {
      // Reset the window
      rateLimitEntry = { count: 1, lastReset: now };
      rateLimitMap.set(key, rateLimitEntry);
      return null; // Allow the request
    }
    
    if (rateLimitEntry.count >= config.maxRequests) {
      // Rate limit exceeded
      return new NextResponse(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: Math.ceil((rateLimitEntry.lastReset + config.windowMs - now) / 1000)
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitEntry.lastReset + config.windowMs - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitEntry.lastReset + config.windowMs).toISOString()
          }
        }
      );
    }
    
    // Increment counter
    rateLimitEntry.count++;
    return null; // Allow the request
  };
}

// Preset rate limiters for different use cases
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'API rate limit exceeded. Please try again in 15 minutes.'
});

export const authRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again in 5 minutes.'
});

export const strictRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Rate limit exceeded. Please slow down.'
});

// Cleanup function (call periodically to prevent memory leaks)
export function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if ((now - entry.lastReset) > (15 * 60 * 1000)) { // Cleanup entries older than 15 minutes
      rateLimitMap.delete(key);
    }
  }
}

// Auto-cleanup every 10 minutes
setInterval(cleanupRateLimitMap, 10 * 60 * 1000);
