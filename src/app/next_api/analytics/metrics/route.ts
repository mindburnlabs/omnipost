
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";

// GET request - fetch analytics metrics
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    const platform_type = url.searchParams.get('platform_type');
    const metric_type = url.searchParams.get('metric_type');
    
    const metricsCrud = new CrudOperations("analytics_metrics", context.token);
    
    const filters: Record<string, any> = {
      user_id: context.payload?.sub
    };
    
    if (metric_type) {
      filters.metric_type = metric_type;
    }
    
    const data = await metricsCrud.findMany(filters, { 
      limit: limit || 100, 
      offset: offset || 0,
      orderBy: {
        column: 'recorded_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch analytics metrics:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch analytics metrics",
      status: 500,
    });
  }
}, true);
