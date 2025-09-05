
// Database health monitoring and connection validation
import { createPostgrestClient } from './postgrest';
import { validateEnv } from './api-utils';

export interface DatabaseHealth {
  connected: boolean;
  responseTime: number;
  tablesAccessible: boolean;
  lastChecked: string;
  error?: string;
}

export interface TableStatus {
  tableName: string;
  exists: boolean;
  accessible: boolean;
  recordCount?: number;
  error?: string;
}

export class DatabaseHealthMonitor {
  private lastHealthCheck: DatabaseHealth | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  async initialize() {
    // Run initial health check
    await this.checkHealth();
    
    // Set up periodic health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, 5 * 60 * 1000);
  }

  async checkHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    
    try {
      validateEnv();
      
      const client = createPostgrestClient();
      
      // Test basic connection with a simple query
      const { data, error } = await client
        .from('users')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const health: DatabaseHealth = {
        connected: true,
        responseTime,
        tablesAccessible: true,
        lastChecked: new Date().toISOString()
      };

      this.lastHealthCheck = health;
      return health;
    } catch (error) {
      const health: DatabaseHealth = {
        connected: false,
        responseTime: Date.now() - startTime,
        tablesAccessible: false,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error'
      };

      this.lastHealthCheck = health;
      console.error('Database health check failed:', error);
      return health;
    }
  }

  async checkTableStatus(tableNames: string[]): Promise<TableStatus[]> {
    const results: TableStatus[] = [];

    try {
      validateEnv();
      const client = createPostgrestClient();

      for (const tableName of tableNames) {
        try {
          const { data, error, count } = await client
            .from(tableName)
            .select('id', { count: 'exact' })
            .limit(1);

          if (error) {
            results.push({
              tableName,
              exists: false,
              accessible: false,
              error: error.message
            });
          } else {
            results.push({
              tableName,
              exists: true,
              accessible: true,
              recordCount: count || 0
            });
          }
        } catch (tableError) {
          results.push({
            tableName,
            exists: false,
            accessible: false,
            error: tableError instanceof Error ? tableError.message : 'Unknown error'
          });
        }
      }
    } catch (envError) {
      // Environment not configured
      for (const tableName of tableNames) {
        results.push({
          tableName,
          exists: false,
          accessible: false,
          error: 'Database environment not configured'
        });
      }
    }

    return results;
  }

  getLastHealthCheck(): DatabaseHealth | null {
    return this.lastHealthCheck;
  }

  async validateCriticalTables(): Promise<{ allTablesOk: boolean; issues: string[] }> {
    const criticalTables = [
      'users',
      'posts',
      'platform_connections',
      'user_profiles',
      'content_templates',
      'analytics_metrics',
      'user_activities'
    ];

    const tableStatuses = await this.checkTableStatus(criticalTables);
    const issues: string[] = [];

    for (const status of tableStatuses) {
      if (!status.exists) {
        issues.push(`Table '${status.tableName}' does not exist`);
      } else if (!status.accessible) {
        issues.push(`Table '${status.tableName}' is not accessible: ${status.error}`);
      }
    }

    return {
      allTablesOk: issues.length === 0,
      issues
    };
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Global database health monitor
let dbHealthMonitor: DatabaseHealthMonitor | null = null;

export async function getDatabaseHealthMonitor(): Promise<DatabaseHealthMonitor> {
  if (!dbHealthMonitor) {
    dbHealthMonitor = new DatabaseHealthMonitor();
    await dbHealthMonitor.initialize();
  }
  return dbHealthMonitor;
}

// Initialize on server start only if database is configured
if (typeof window === 'undefined') {
  // Check if required environment variables are set before attempting to initialize
  const hasRequiredEnvVars = process.env.POSTGREST_URL && process.env.POSTGREST_SCHEMA && process.env.POSTGREST_API_KEY;
  
  if (hasRequiredEnvVars) {
    getDatabaseHealthMonitor().catch(error => {
      console.error('Failed to initialize database health monitor:', error);
      console.log('Database health monitor will be initialized on demand when database is available.');
    });
  } else {
    console.log('PostgREST environment variables not configured. Database health monitor will initialize on demand.');
  }
}
