
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";

// GET request - fetch posting time recommendations
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    
    const recommendationsCrud = new CrudOperations("posting_time_recommendations", context.token);
    
    const filters: Record<string, any> = {
      user_id: context.payload?.sub
    };
    
    if (platform) {
      filters.platform_type = platform;
    }
    
    const data = await recommendationsCrud.findMany(filters, { 
      limit: limit || 20, 
      offset: offset || 0,
      orderBy: {
        column: 'engagement_score',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch posting time recommendations:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch posting time recommendations",
      status: 500,
    });
  }
}, true);
