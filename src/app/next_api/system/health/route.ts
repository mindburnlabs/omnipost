
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { getDatabaseHealthMonitor } from '@/lib/database-health';
import { getPublishingEngine } from '@/lib/publishing-engine';

// GET request - system health check
export const GET = requestMiddleware(async (request, context) => {
  try {
    const dbMonitor = await getDatabaseHealthMonitor();
    const publishingEngine = await getPublishingEngine();
    
    // Get database health
    const dbHealth = await dbMonitor.checkHealth();
    
    // Get publishing queue stats
    const queueStats = await publishingEngine.getPublishingStats();
    
    // Check critical tables
    const { allTablesOk, issues } = await dbMonitor.validateCriticalTables();
    
    // Overall system status
    const systemStatus = dbHealth.connected && allTablesOk ? 'healthy' : 'degraded';
    
    const healthData = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth.connected,
        responseTime: dbHealth.responseTime,
        tablesAccessible: dbHealth.tablesAccessible,
        allTablesOk,
        issues: issues.length > 0 ? issues : undefined,
        error: dbHealth.error
      },
      publishing: {
        queueStats,
        engineRunning: true
      },
      services: {
        ai: {
          gemini: !!process.env.GEMINI_API_KEY,
          openrouter: !!process.env.OPENROUTER_API_KEY
        },
        platforms: {
          discord: !!process.env.DISCORD_APPLICATION_ID,
          telegram: !!process.env.TELEGRAM_BOT_TOKEN,
          whop: !!process.env.WHOP_API_KEY
        }
      }
    };
    
    return createSuccessResponse(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    return createErrorResponse({
      errorMessage: "Health check failed",
      status: 500,
    });
  }
}, false); // No auth required for health checks
