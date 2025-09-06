import { createRateLimit, apiRateLimit, authRateLimit, cleanupRateLimitMap } from '../rateLimit';
import { createMockRequest, setupTestEnv, cleanupTestEnv } from '../../__tests__/utils/testUtils';

// Mock setTimeout and clearTimeout for testing
jest.useFakeTimers();

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    setupTestEnv();
    // Clear any existing rate limit data
    cleanupRateLimitMap();
  });

  afterEach(() => {
    cleanupTestEnv();
    jest.clearAllTimers();
  });

  describe('createRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      });

      const request = createMockRequest({
        ip: '192.168.1.1',
      });

      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(request);
        expect(result).toBeNull(); // Null means allowed
      }
    });

    it('should block requests exceeding rate limit', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 2,
        message: 'Custom rate limit message',
      });

      const request = createMockRequest({
        ip: '192.168.1.2',
      });

      // First 2 requests should be allowed
      expect(rateLimit(request)).toBeNull();
      expect(rateLimit(request)).toBeNull();

      // Third request should be blocked
      const blockedResponse = rateLimit(request);
      expect(blockedResponse).not.toBeNull();
      expect(blockedResponse?.status).toBe(429);
      
      // Check response body
      blockedResponse?.json().then(body => {
        expect(body.message).toBe('Custom rate limit message');
        expect(body.retryAfter).toBeGreaterThan(0);
      });
    });

    it('should reset rate limit after window expires', () => {
      const rateLimit = createRateLimit({
        windowMs: 1000, // 1 second
        maxRequests: 1,
      });

      const request = createMockRequest({
        ip: '192.168.1.3',
      });

      // First request should be allowed
      expect(rateLimit(request)).toBeNull();

      // Second request should be blocked
      expect(rateLimit(request)).not.toBeNull();

      // Advance time past window
      jest.advanceTimersByTime(1001);

      // New request should be allowed again
      expect(rateLimit(request)).toBeNull();
    });

    it('should use custom key generator', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (request) => request.headers.get('user-id') || 'anonymous',
      });

      const request1 = createMockRequest({
        headers: { 'user-id': 'user-1' },
      });
      
      const request2 = createMockRequest({
        headers: { 'user-id': 'user-2' },
      });

      // Both users should be allowed (separate rate limits)
      expect(rateLimit(request1)).toBeNull();
      expect(rateLimit(request2)).toBeNull();

      // Second request from user-1 should be blocked
      expect(rateLimit(request1)).not.toBeNull();
      
      // But user-2 should still be allowed
      expect(rateLimit(request2)).toBeNull();
    });

    it('should include rate limit headers in blocked response', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      });

      const request = createMockRequest({
        ip: '192.168.1.4',
      });

      // Allow first request
      rateLimit(request);

      // Block second request
      const blockedResponse = rateLimit(request);
      expect(blockedResponse).not.toBeNull();

      if (blockedResponse) {
        expect(blockedResponse.headers.get('X-RateLimit-Limit')).toBe('1');
        expect(blockedResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(blockedResponse.headers.get('Retry-After')).toBeTruthy();
        expect(blockedResponse.headers.get('X-RateLimit-Reset')).toBeTruthy();
      }
    });
  });

  describe('Preset Rate Limiters', () => {
    describe('apiRateLimit', () => {
      it('should have appropriate limits for API usage', () => {
        const request = createMockRequest({
          ip: '192.168.1.5',
        });

        // Should allow many API requests
        let allowedCount = 0;
        for (let i = 0; i < 101; i++) {
          const result = apiRateLimit(request);
          if (result === null) {
            allowedCount++;
          } else {
            break;
          }
        }

        expect(allowedCount).toBe(100); // Default API limit
      });
    });

    describe('authRateLimit', () => {
      it('should have stricter limits for auth endpoints', () => {
        const request = createMockRequest({
          ip: '192.168.1.6',
        });

        // Should allow only a few auth requests
        let allowedCount = 0;
        for (let i = 0; i < 10; i++) {
          const result = authRateLimit(request);
          if (result === null) {
            allowedCount++;
          } else {
            break;
          }
        }

        expect(allowedCount).toBe(5); // Strict auth limit
      });

      it('should provide appropriate error message for auth rate limiting', async () => {
        const request = createMockRequest({
          ip: '192.168.1.7',
        });

        // Exhaust the rate limit
        for (let i = 0; i < 5; i++) {
          authRateLimit(request);
        }

        // Next request should be blocked with appropriate message
        const blockedResponse = authRateLimit(request);
        expect(blockedResponse).not.toBeNull();

        if (blockedResponse) {
          const body = await blockedResponse.json();
          expect(body.message).toContain('authentication attempts');
        }
      });
    });
  });

  describe('Rate Limit Map Cleanup', () => {
    it('should clean up expired entries', () => {
      const rateLimit = createRateLimit({
        windowMs: 1000, // 1 second
        maxRequests: 5,
      });

      const request = createMockRequest({
        ip: '192.168.1.8',
      });

      // Make some requests
      rateLimit(request);
      rateLimit(request);

      // Advance time beyond cleanup threshold
      jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes

      // Trigger cleanup
      cleanupRateLimitMap();

      // New requests should work as if no previous requests were made
      let allowedCount = 0;
      for (let i = 0; i < 6; i++) {
        const result = rateLimit(request);
        if (result === null) {
          allowedCount++;
        } else {
          break;
        }
      }

      expect(allowedCount).toBe(5); // Full limit available again
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests without IP address', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const request = createMockRequest({
        ip: '', // No IP
      });

      // Should still work with fallback key
      expect(rateLimit(request)).toBeNull();
      expect(rateLimit(request)).toBeNull();
      expect(rateLimit(request)).not.toBeNull(); // Third should be blocked
    });

    it('should handle concurrent requests from same IP', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 3,
      });

      const createRequest = () => createMockRequest({
        ip: '192.168.1.9',
      });

      // Simulate concurrent requests
      const results = [
        rateLimit(createRequest()),
        rateLimit(createRequest()),
        rateLimit(createRequest()),
        rateLimit(createRequest()), // This should be blocked
      ];

      const allowedCount = results.filter(r => r === null).length;
      const blockedCount = results.filter(r => r !== null).length;

      expect(allowedCount).toBe(3);
      expect(blockedCount).toBe(1);
    });

    it('should handle malformed headers gracefully', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const request = createMockRequest({
        headers: {
          'x-forwarded-for': 'invalid-ip-format',
          'x-real-ip': '',
        },
      });

      // Should not throw error and should work with fallback
      expect(() => rateLimit(request)).not.toThrow();
      expect(rateLimit(request)).toBeNull();
    });
  });
});
