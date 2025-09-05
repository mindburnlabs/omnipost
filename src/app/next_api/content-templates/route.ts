
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch content templates
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const contentTemplateType = url.searchParams.get('template_type');
    
    const contentTemplatesCrud = new CrudOperations("content_templates", context.token);
    
    const filters: Record<string, string | number> = {};
    
    // Only add user_id if it exists
    if (context.payload?.sub) {
      filters.user_id = context.payload.sub;
    }
    
    if (contentTemplateType) {
      filters.template_type = contentTemplateType;
    }
    
    const data = await contentTemplatesCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch content templates:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch content templates",
      status: 500,
    });
  }
}, true);

// POST request - create content template
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.template_content) {
      return createErrorResponse({
        errorMessage: "Name and content are required",
        status: 400,
      });
    }
    
    const contentTemplatesCrud = new CrudOperations("content_templates", context.token);
    const user_id = context.payload?.sub;
    
    const contentTemplateData = {
      ...body,
      user_id,
      platform_specific: body.platform_specific || {},
      usage_count: 0,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const data = await contentTemplatesCrud.create(contentTemplateData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create content template:', error);
    return createErrorResponse({
      errorMessage: "Failed to create content template",
      status: 500,
    });
  }
}, true);
