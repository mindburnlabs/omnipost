import { NextRequest } from 'next/server';

// ===========================================
// MOCK REQUEST UTILITIES
// ===========================================

export function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  ip?: string;
}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    headers = {},
    body,
    ip = '127.0.0.1'
  } = options;

  const request = new NextRequest(new Request(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  }));

  // Mock IP address
  Object.defineProperty(request, 'ip', {
    value: ip,
    writable: true,
  });

  return request;
}

// ===========================================
// MOCK DATA GENERATORS
// ===========================================

export const mockData = {
  user: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  post: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Test Post',
    content: 'This is a test post content',
    platforms: ['twitter', 'linkedin'],
    status: 'draft' as const,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    scheduledAt: null,
    publishedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  platformConnection: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    platform: 'twitter' as const,
    platformUserId: 'twitter123',
    platformUsername: 'testuser',
    accessToken: 'encrypted_token',
    refreshToken: 'encrypted_refresh_token',
    isActive: true,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  validationError: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [
        {
          field: 'email',
          message: 'Invalid email format',
          code: 'invalid_string',
        },
      ],
    },
    timestamp: expect.any(String),
    requestId: expect.any(String),
  },
};

// ===========================================
// TEST ASSERTIONS
// ===========================================

export const assertions = {
  /**
   * Assert that a response matches the API success format
   */
  expectApiSuccess: (response: any, expectedData?: any) => {
    expect(response).toMatchObject({
      success: true,
      data: expectedData || expect.any(Object),
      timestamp: expect.any(String),
    });
  },

  /**
   * Assert that a response matches the API error format
   */
  expectApiError: (response: any, expectedCode?: string, expectedStatus?: number) => {
    expect(response).toMatchObject({
      success: false,
      error: {
        code: expectedCode || expect.any(String),
        message: expect.any(String),
      },
      timestamp: expect.any(String),
      requestId: expect.any(String),
    });
  },

  /**
   * Assert rate limit headers are present
   */
  expectRateLimitHeaders: (headers: Headers) => {
    expect(headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(headers.get('X-RateLimit-Reset')).toBeDefined();
  },

  /**
   * Assert security headers are present
   */
  expectSecurityHeaders: (headers: Headers) => {
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe('origin-when-cross-origin');
    expect(headers.get('X-XSS-Protection')).toBe('1; mode=block');
  },
};

// ===========================================
// DATABASE MOCKS
// ===========================================

export const mockDatabase = {
  users: new Map([
    [mockData.user.id, mockData.user],
  ]),

  posts: new Map([
    [mockData.post.id, mockData.post],
  ]),

  platformConnections: new Map([
    [mockData.platformConnection.id, mockData.platformConnection],
  ]),

  /**
   * Reset all mock data to initial state
   */
  reset: () => {
    mockDatabase.users.clear();
    mockDatabase.posts.clear();
    mockDatabase.platformConnections.clear();
    
    mockDatabase.users.set(mockData.user.id, mockData.user);
    mockDatabase.posts.set(mockData.post.id, mockData.post);
    mockDatabase.platformConnections.set(mockData.platformConnection.id, mockData.platformConnection);
  },
};

// ===========================================
// ENVIRONMENT SETUP
// ===========================================

export const setupTestEnv = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  
  // Disable Redis cache in tests by default
  delete process.env.REDIS_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
};

export const cleanupTestEnv = () => {
  // Reset mock data
  mockDatabase.reset();
  
  // Clear any test-specific environment variables
  delete process.env.TEST_USER_ID;
};

// ===========================================
// ASYNC TESTING UTILITIES
// ===========================================

export const asyncUtils = {
  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Wait for a condition to be true
   */
  waitFor: async (
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> => {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await asyncUtils.wait(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },
};

// ===========================================
// ERROR SIMULATION
// ===========================================

export const simulateErrors = {
  networkError: () => {
    throw new Error('Network request failed');
  },

  databaseError: () => {
    const error = new Error('Database connection failed');
    (error as any).code = '57P01'; // PostgreSQL connection failure
    throw error;
  },

  validationError: (field: string, message: string) => {
    const error = new Error(message);
    error.name = 'ValidationError';
    (error as any).details = [{ field, message, code: 'invalid' }];
    throw error;
  },

  rateLimitError: () => {
    const error = new Error('Rate limit exceeded');
    error.name = 'RateLimitError';
    throw error;
  },
};
