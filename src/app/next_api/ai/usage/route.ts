
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";

// GET request - fetch AI usage statistics
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    
    const usageCrud = new CrudOperations("ai_usage_logs", context.token);
    const user_id = context.payload?.sub;
    
    if (!user_id) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const filters: Record<string, any> = { user_id };
    if (provider) filters.provider_name = provider;

    const usageLogs = await usageCrud.findMany(filters, {
      limit: limit || 100,
      offset: offset || 0,
      orderBy: { column: 'created_at', direction: 'desc' }
    });

    // Calculate usage statistics
    const totalRequests = usageLogs.length;
    const successfulRequests = usageLogs.filter(log => log.status === 'success').length;
    const totalTokens = usageLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
    const totalCost = usageLogs.reduce((sum, log) => sum + (log.cost_estimate || 0), 0);

    // Group by provider
    const providerStats = usageLogs.reduce((acc, log) => {
      if (!acc[log.provider_name]) {
        acc[log.provider_name] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          success_rate: 0
        };
      }
      acc[log.provider_name].requests++;
      acc[log.provider_name].tokens += log.total_tokens || 0;
      acc[log.provider_name].cost += log.cost_estimate || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calculate success rates
    Object.keys(providerStats).forEach(provider => {
      const providerLogs = usageLogs.filter(log => log.provider_name === provider);
      const successful = providerLogs.filter(log => log.status === 'success').length;
      providerStats[provider].success_rate = Math.round((successful / providerLogs.length) * 100);
    });

    return createSuccessResponse({
      summary: {
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        success_rate: totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0,
        total_tokens: totalTokens,
        estimated_cost: totalCost
      },
      provider_breakdown: providerStats,
      recent_usage: usageLogs.slice(0, 20).map(log => ({
        id: log.id,
        provider: log.provider_name,
        model: log.model_name,
        usage_type: log.usage_type,
        tokens: log.total_tokens,
        status: log.status,
        created_at: log.created_at
      }))
    });
  } catch (error) {
    console.error('Failed to fetch AI usage:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch AI usage statistics",
      status: 500,
    });
  }
}, true);
