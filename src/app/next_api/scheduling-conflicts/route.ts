
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";

// GET request - fetch scheduling conflicts
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const resolved = url.searchParams.get('resolved') === 'true';
    
    const conflictsCrud = new CrudOperations("scheduling_conflicts", context.token);
    
    const filters: Record<string, any> = {
      user_id: context.payload?.sub,
      resolved
    };
    
    const data = await conflictsCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch scheduling conflicts:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch scheduling conflicts",
      status: 500,
    });
  }
}, true);
