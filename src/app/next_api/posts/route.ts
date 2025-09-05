
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch posts
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset, search } = parseQueryParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    const postsCrud = new CrudOperations("posts", context.token);
    
    // Build filter conditions
    const filters: Record<string, any> = {
      user_id: context.payload?.sub
    };
    
    if (status) {
      filters.status = status;
    }
    
    if (search) {
      // Note: This is a simplified search - in production you'd want more sophisticated search
      filters.title = search;
    }
    
    const data = await postsCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch posts",
      status: 500,
    });
  }
}, true);

// POST request - create post
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.content) {
      return createErrorResponse({
        errorMessage: "Content is required",
        status: 400,
      });
    }
    
    const postsCrud = new CrudOperations("posts", context.token);
    const user_id = context.payload?.sub;
    
    const postData = {
      ...body,
      user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const data = await postsCrud.create(postData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create post:', error);
    return createErrorResponse({
      errorMessage: "Failed to create post",
      status: 500,
    });
  }
}, true);
