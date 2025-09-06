// ===========================================
// PERFORMANCE MONITORING & OPTIMIZATION
// ===========================================

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface DatabaseQueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

interface ApiRequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private dbMetrics: DatabaseQueryMetrics[] = [];
  private apiMetrics: ApiRequestMetrics[] = [];
  private maxMetrics = 1000; // Limit stored metrics

  /**
   * Measure execution time of a function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.addMetric({
        name: `${name}_error`,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, error: (error as Error).message },
      });
      
      throw error;
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(
    query: string,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const metric: DatabaseQueryMetrics = {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: Date.now(),
      success,
      error,
    };

    this.dbMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetrics);
    }

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn(`Slow database query detected:`, {
        query: metric.query,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  }

  /**
   * Track API request performance
   */
  trackApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userAgent?: string,
    ip?: string
  ): void {
    const metric: ApiRequestMetrics = {
      method,
      path,
      statusCode,
      duration,
      timestamp: Date.now(),
      userAgent,
      ip,
    };

    this.apiMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }

    // Log slow API requests (>2000ms)
    if (duration > 2000) {
      console.warn(`Slow API request detected:`, {
        method,
        path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode,
      });
    }
  }

  /**
   * Add a custom performance metric
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindowMs: number = 60000): {
    api: {
      total: number;
      avgDuration: number;
      errorRate: number;
      slowRequests: number;
    };
    database: {
      total: number;
      avgDuration: number;
      errorRate: number;
      slowQueries: number;
    };
    custom: {
      total: number;
      avgDuration: number;
    };
  } {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    // Filter metrics within time window
    const recentApiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff);
    const recentDbMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff);
    const recentCustomMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    // API statistics
    const apiStats = {
      total: recentApiMetrics.length,
      avgDuration: recentApiMetrics.length > 0 
        ? recentApiMetrics.reduce((sum, m) => sum + m.duration, 0) / recentApiMetrics.length 
        : 0,
      errorRate: recentApiMetrics.length > 0 
        ? recentApiMetrics.filter(m => m.statusCode >= 400).length / recentApiMetrics.length 
        : 0,
      slowRequests: recentApiMetrics.filter(m => m.duration > 2000).length,
    };

    // Database statistics
    const dbStats = {
      total: recentDbMetrics.length,
      avgDuration: recentDbMetrics.length > 0 
        ? recentDbMetrics.reduce((sum, m) => sum + m.duration, 0) / recentDbMetrics.length 
        : 0,
      errorRate: recentDbMetrics.length > 0 
        ? recentDbMetrics.filter(m => !m.success).length / recentDbMetrics.length 
        : 0,
      slowQueries: recentDbMetrics.filter(m => m.duration > 1000).length,
    };

    // Custom metrics statistics
    const customStats = {
      total: recentCustomMetrics.length,
      avgDuration: recentCustomMetrics.length > 0 
        ? recentCustomMetrics.reduce((sum, m) => sum + m.duration, 0) / recentCustomMetrics.length 
        : 0,
    };

    return {
      api: apiStats,
      database: dbStats,
      custom: customStats,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.dbMetrics = [];
    this.apiMetrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    custom: PerformanceMetric[];
    database: DatabaseQueryMetrics[];
    api: ApiRequestMetrics[];
  } {
    return {
      custom: [...this.metrics],
      database: [...this.dbMetrics],
      api: [...this.apiMetrics],
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// ===========================================
// PERFORMANCE DECORATORS
// ===========================================

/**
 * Decorator to measure function execution time
 */
export function measurePerformance(name?: string) {
  return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
    const method = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        metricName,
        () => method.apply(this, args),
        { args: args.length }
      );
    };
  };
}

/**
 * Higher-order function to measure async functions
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    return performanceMonitor.measure(name, () => fn(...args), { args: args.length });
  }) as T;
}

// ===========================================
// DATABASE PERFORMANCE WRAPPER
// ===========================================

export function withDatabaseMetrics<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  queryName: string
): T {
  return (async (...args: any[]) => {
    const start = performance.now();
    let success = true;
    let error: string | undefined;
    
    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      success = false;
      error = (err as Error).message;
      throw err;
    } finally {
      const duration = performance.now() - start;
      performanceMonitor.trackDatabaseQuery(queryName, duration, success, error);
    }
  }) as T;
}

// ===========================================
// MEMORY MONITORING
// ===========================================

export class MemoryMonitor {
  /**
   * Get current memory usage
   */
  static getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    heapUsedMB: number;
    heapTotalMB: number;
  } {
    const usage = process.memoryUsage();
    
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
    };
  }

  /**
   * Check if memory usage is high
   */
  static isMemoryUsageHigh(threshold: number = 512): boolean {
    const usage = this.getMemoryUsage();
    return usage.heapUsedMB > threshold;
  }

  /**
   * Log memory usage if it's high
   */
  static checkMemoryUsage(context?: string): void {
    const usage = this.getMemoryUsage();
    
    if (this.isMemoryUsageHigh()) {
      console.warn(`High memory usage detected ${context ? `in ${context}` : ''}:`, {
        heapUsedMB: usage.heapUsedMB,
        heapTotalMB: usage.heapTotalMB,
      });
    }
  }
}

// ===========================================
// PERFORMANCE UTILITIES
// ===========================================

export const performanceUtils = {
  /**
   * Debounce function to limit execution frequency
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * Throttle function to limit execution rate
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, wait);
      }
    };
  },

  /**
   * Batch array processing to avoid blocking the event loop
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R> | R,
    batchSize: number = 10,
    delay: number = 0
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      // Add delay between batches to prevent overwhelming the system
      if (delay > 0 && i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  },

  /**
   * Measure and log execution time
   */
  async timeExecution<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      console.log(`${name} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },
};
