
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";

// GET request - fetch content assets
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const file_type = url.searchParams.get('file_type');
    
    const assetsCrud = new CrudOperations("content_assets", context.token);
    
    const filters: Record<string, any> = {
      user_id: context.payload?.sub
    };
    
    if (file_type) {
      filters.file_type = file_type;
    }
    
    const data = await assetsCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch content assets:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch content assets",
      status: 500,
    });
  }
}, true);
