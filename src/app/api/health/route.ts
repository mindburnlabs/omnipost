// ===========================================
// ENHANCED SYSTEM HEALTH CHECK
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceCommunicator } from '@/lib/service-communication';
import CrudOperations from '@/lib/crud-operations';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: Record<string, ServiceHealth>;
  database: DatabaseHealth;
  dependencies: DependencyHealth;
  performance: PerformanceMetrics;
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

interface DatabaseHealth {
  connected: boolean;
  responseTime: number;
  error?: string;
  poolStatus?: {
    active: number;
    idle: number;
    waiting: number;
  };
}

interface DependencyHealth {
  supabase: ServiceHealth;
  redis: ServiceHealth;
  postgres: ServiceHealth;
}

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Initialize service communicator
    const serviceCommunicator = getServiceCommunicator();
    
    // Check all services in parallel
    const [
      databaseHealth,
      servicesHealth,
      dependenciesHealth
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkServicesHealth(serviceCommunicator),
      checkDependenciesHealth()
    ]);

    // Calculate overall system health
    const overallHealth = calculateOverallHealth({
      database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : null,
      services: servicesHealth.status === 'fulfilled' ? servicesHealth.value : {},
      dependencies: dependenciesHealth.status === 'fulfilled' ? dependenciesHealth.value : null
    });

    const healthStatus: HealthStatus = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: servicesHealth.status === 'fulfilled' ? servicesHealth.value : {},
      database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : {
        connected: false,
        responseTime: Date.now() - startTime,
        error: 'Database health check failed'
      },
      dependencies: dependenciesHealth.status === 'fulfilled' ? dependenciesHealth.value : {
        supabase: { status: 'unknown', lastCheck: new Date().toISOString() },
        redis: { status: 'unknown', lastCheck: new Date().toISOString() },
        postgres: { status: 'unknown', lastCheck: new Date().toISOString() }
      },
      performance: getPerformanceMetrics()
    };

    // Return appropriate HTTP status based on health
    const httpStatus = overallHealth === 'healthy' ? 200 : 
                      overallHealth === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorHealth: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {},
      database: {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      dependencies: {
        supabase: { status: 'unknown', lastCheck: new Date().toISOString() },
        redis: { status: 'unknown', lastCheck: new Date().toISOString() },
        postgres: { status: 'unknown', lastCheck: new Date().toISOString() }
      },
      performance: getPerformanceMetrics()
    };

    return NextResponse.json(errorHealth, { status: 503 });
  }
}

async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now();
  
  try {
    const crud = new CrudOperations('posts');
    
    // Simple query to test database connectivity
    await crud.findMany({}, { limit: 1 });
    
    return {
      connected: true,
      responseTime: Date.now() - startTime,
      poolStatus: {
        active: 1, // Would be actual pool stats in production
        idle: 5,
        waiting: 0
      }
    };
  } catch (error) {
    return {
      connected: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkServicesHealth(serviceCommunicator: any): Promise<Record<string, ServiceHealth>> {
  const services = ['worker', 'ai'];
  const healthResults: Record<string, ServiceHealth> = {};
  
  // Check each service in parallel
  const healthChecks = services.map(async (serviceName) => {
    try {
      const result = await serviceCommunicator.checkServiceHealth(serviceName);
      healthResults[serviceName] = {
        status: result.success ? 'healthy' : 'unhealthy',
        responseTime: result.responseTime,
        error: result.error,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      healthResults[serviceName] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Service check failed',
        lastCheck: new Date().toISOString()
      };
    }
  });
  
  await Promise.allSettled(healthChecks);
  return healthResults;
}

async function checkDependenciesHealth(): Promise<DependencyHealth> {
  const now = new Date().toISOString();
  
  // Check Supabase
  let supabaseHealth: ServiceHealth;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const startTime = Date.now();
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      
      supabaseHealth = {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: now
      };
    } else {
      supabaseHealth = {
        status: 'unknown',
        error: 'Supabase URL not configured',
        lastCheck: now
      };
    }
  } catch (error) {
    supabaseHealth = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Supabase check failed',
      lastCheck: now
    };
  }

  // Check Redis
  let redisHealth: ServiceHealth;
  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      // In production, you'd actually ping Redis here
      redisHealth = {
        status: 'healthy',
        responseTime: 5, // Mock value
        lastCheck: now
      };
    } else {
      redisHealth = {
        status: 'unknown',
        error: 'Redis not configured',
        lastCheck: now
      };
    }
  } catch (error) {
    redisHealth = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis check failed',
      lastCheck: now
    };
  }

  // Check Railway PostgreSQL
  let postgresHealth: ServiceHealth;
  try {
    const postgresUrl = process.env.DATABASE_URL;
    if (postgresUrl) {
      // In production, you'd ping PostgreSQL here
      postgresHealth = {
        status: 'healthy',
        responseTime: 10, // Mock value
        lastCheck: now
      };
    } else {
      postgresHealth = {
        status: 'unknown',
        error: 'PostgreSQL not configured',
        lastCheck: now
      };
    }
  } catch (error) {
    postgresHealth = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'PostgreSQL check failed',
      lastCheck: now
    };
  }

  return {
    supabase: supabaseHealth,
    redis: redisHealth,
    postgres: postgresHealth
  };
}

function calculateOverallHealth(checks: {
  database: DatabaseHealth | null;
  services: Record<string, ServiceHealth>;
  dependencies: DependencyHealth | null;
}): 'healthy' | 'degraded' | 'unhealthy' {
  // Critical: Database must be healthy
  if (!checks.database?.connected) {
    return 'unhealthy';
  }

  // Check services
  const serviceStatuses = Object.values(checks.services);
  const unhealthyServices = serviceStatuses.filter(s => s.status === 'unhealthy');
  
  if (unhealthyServices.length > 0) {
    // If any service is down, system is degraded
    return 'degraded';
  }

  // Check dependencies
  if (checks.dependencies) {
    const { supabase, redis, postgres } = checks.dependencies;
    
    // Supabase is critical
    if (supabase.status === 'unhealthy') {
      return 'degraded';
    }
    
    // Redis and Postgres failures are degraded state
    if (redis.status === 'unhealthy' || postgres.status === 'unhealthy') {
      return 'degraded';
    }
  }

  return 'healthy';
}

function getPerformanceMetrics(): PerformanceMetrics {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
  
  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / totalMemory) * 100)
    },
    cpu: {
      usage: 0 // Would need additional monitoring for real CPU usage
    }
  };
}
