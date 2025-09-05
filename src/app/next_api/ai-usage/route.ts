
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { getAIProviderSystem } from '@/lib/ai-provider-system';

// GET request - get AI usage metrics and analytics
export const GET = requestMiddleware(async (request, context) => {
  try {
    const userId = parseInt(context.payload?.sub || '0');
    const url = new URL(request.url);
    const workspaceId = parseInt(url.searchParams.get('workspace_id') || '1');
    const timeframe = url.searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'month';
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const aiSystem = await getAIProviderSystem();
    const metrics = await aiSystem.getUsageMetrics(userId, workspaceId, timeframe);
    
    // Calculate additional insights
    const insights = {
      cost_trend: metrics.totalCost > 0 ? 'increasing' : 'stable',
      most_used_provider: Object.entries(metrics.byProvider)
        .sort(([,a], [,b]) => (b as any).calls - (a as any).calls)[0]?.[0] || 'none',
      most_used_alias: Object.entries(metrics.byAlias)
        .sort(([,a], [,b]) => (b as any).calls - (a as any).calls)[0]?.[0] || 'none',
      avg_cost_per_call: metrics.totalCalls > 0 ? metrics.totalCost / metrics.totalCalls : 0,
      avg_tokens_per_call: metrics.totalCalls > 0 ? metrics.totalTokens / metrics.totalCalls : 0,
      error_rate: metrics.totalCalls > 0 ? (metrics.recentErrors.length / metrics.totalCalls) * 100 : 0
    };

    return createSuccessResponse({
      timeframe,
      summary: {
        total_calls: metrics.totalCalls,
        total_tokens: metrics.totalTokens,
        total_cost_usd: metrics.totalCost,
        avg_cost_per_call: insights.avg_cost_per_call,
        avg_tokens_per_call: insights.avg_tokens_per_call,
        error_rate_percent: insights.error_rate
      },
      by_provider: metrics.byProvider,
      by_alias: metrics.byAlias,
      recent_errors: metrics.recentErrors,
      insights
    });
  } catch (error) {
    console.error('Failed to get AI usage:', error);
    return createErrorResponse({
      errorMessage: "Failed to get AI usage metrics",
      status: 500,
    });
  }
}, true);
