import { Redis } from '@upstash/redis';

// Initialize Redis client (supports both Upstash and Railway Redis)
const redis = new Redis({
  url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

const DEFAULT_TTL = 3600; // 1 hour in seconds

// ===========================================
// CORE CACHE FUNCTIONS
// ===========================================

export class Cache {
  /**
   * Get a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
        return null; // Cache disabled
      }
      
      const value = await redis.get(key);
      return value as T;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  static async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
        return false; // Cache disabled
      }
      
      const { ttl = DEFAULT_TTL, tags = [] } = options;
      
      // Set the main cache entry
      await redis.setex(key, ttl, JSON.stringify(value));
      
      // Set tags for cache invalidation
      if (tags.length > 0) {
        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          await redis.sadd(tagKey, key);
          await redis.expire(tagKey, ttl * 2); // Tags live longer
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a specific key from cache
   */
  static async delete(key: string): Promise<boolean> {
    try {
      if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
        return false;
      }
      
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by tag
   */
  static async invalidateByTag(tag: string): Promise<boolean> {
    try {
      if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
        return false;
      }
      
      const tagKey = `tag:${tag}`;
      const keys = await redis.smembers(tagKey);
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      
      await redis.del(tagKey);
      return true;
    } catch (error) {
      console.error(`Cache invalidate by tag error for tag ${tag}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<any> {
    try {
      if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
        return { status: 'disabled' };
      }
      
      const info = await redis.info();
      return {
        status: 'connected',
        info,
      };
    } catch (error) {
      console.error('Cache STATS error:', error);
      return { status: 'error', error: error.message };
    }
  }
}

// ===========================================
// APPLICATION-SPECIFIC CACHE UTILITIES
// ===========================================

export const PostCache = {
  async setPost(post: any): Promise<void> {
    await Cache.set(`post:${post.id}`, post, {
      ttl: 1800, // 30 minutes
      tags: ['posts', `user:${post.userId}`]
    });
  },

  async getPost(id: string): Promise<any> {
    return Cache.get(`post:${id}`);
  },

  async setUserPosts(userId: string, posts: any[], page: number = 1): Promise<void> {
    await Cache.set(`user:${userId}:posts:page:${page}`, posts, {
      ttl: 900, // 15 minutes
      tags: ['posts', `user:${userId}`]
    });
  },

  async getUserPosts(userId: string, page: number = 1): Promise<any[]> {
    return Cache.get(`user:${userId}:posts:page:${page}`);
  },

  async invalidateUserCache(userId: string): Promise<void> {
    await Cache.invalidateByTag(`user:${userId}`);
  },
};

export const UserCache = {
  async setProfile(user: any): Promise<void> {
    await Cache.set(`user:profile:${user.id}`, user, {
      ttl: 3600, // 1 hour
      tags: ['users', `user:${user.id}`]
    });
  },

  async getProfile(userId: string): Promise<any> {
    return Cache.get(`user:profile:${userId}`);
  },

  async setPlatformConnections(userId: string, connections: any[]): Promise<void> {
    await Cache.set(`user:${userId}:platforms`, connections, {
      ttl: 1800, // 30 minutes
      tags: ['platforms', `user:${userId}`]
    });
  },

  async getPlatformConnections(userId: string): Promise<any[]> {
    return Cache.get(`user:${userId}:platforms`);
  },
};

// ===========================================
// CACHE UTILITIES FOR SPECIFIC USE CASES
// ===========================================

export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  options: CacheOptions = {}
): T {
  return (async (...args: any[]) => {
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    
    // Try cache first
    let result = await Cache.get(key);
    
    if (result !== null) {
      return result;
    }
    
    // Execute function
    result = await fn(...args);
    
    // Cache result
    if (result !== null && result !== undefined) {
      await Cache.set(key, result, options);
    }
    
    return result;
  }) as T;
}
