
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch brand kits
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const brandKitsCrud = new CrudOperations("brand_kits", context.token);
    
    const filters = {
      user_id: context.payload?.sub
    };
    
    const data = await brandKitsCrud.findMany(filters, { 
      limit: limit || 10, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch brand kits:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch brand kits",
      status: 500,
    });
  }
}, true);

// POST request - create brand kit
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name) {
      return createErrorResponse({
        errorMessage: "Brand kit name is required",
        status: 400,
      });
    }
    
    const brandKitsCrud = new CrudOperations("brand_kits", context.token);
    const user_id = context.payload?.sub;
    
    const brandKitData = {
      ...body,
      user_id,
      fonts: body.fonts || {},
      utm_templates: body.utm_templates || {},
      banned_words: body.banned_words || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const data = await brandKitsCrud.create(brandKitData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create brand kit:', error);
    return createErrorResponse({
      errorMessage: "Failed to create brand kit",
      status: 500,
    });
  }
}, true);
