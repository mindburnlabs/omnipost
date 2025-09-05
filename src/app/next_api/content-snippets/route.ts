
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch content snippets
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    const snippetsCrud = new CrudOperations("content_snippets", context.token);
    
    const filters: Record<string, any> = {
      user_id: context.payload?.sub
    };
    
    if (category) {
      filters.category = category;
    }
    
    const data = await snippetsCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch content snippets:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch content snippets",
      status: 500,
    });
  }
}, true);

// POST request - create content snippet
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.content) {
      return createErrorResponse({
        errorMessage: "Name and content are required",
        status: 400,
      });
    }
    
    const snippetsCrud = new CrudOperations("content_snippets", context.token);
    const user_id = context.payload?.sub;
    
    const snippetData = {
      ...body,
      user_id,
      usage_count: 0,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const data = await snippetsCrud.create(snippetData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create content snippet:', error);
    return createErrorResponse({
      errorMessage: "Failed to create content snippet",
      status: 500,
    });
  }
}, true);
