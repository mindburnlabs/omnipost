
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch platform connections
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    
    const filters = {
      user_id: context.payload?.sub
    };
    
    const data = await connectionsCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch platform connections:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch platform connections",
      status: 500,
    });
  }
}, true);

// POST request - create platform connection
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.platform_type || !body.connection_name) {
      return createErrorResponse({
        errorMessage: "Platform type and connection name are required",
        status: 400,
      });
    }
    
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const user_id = context.payload?.sub;
    
    const connectionData = {
      ...body,
      user_id,
      api_credentials: body.api_credentials || {},
      connection_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const data = await connectionsCrud.create(connectionData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create platform connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to create platform connection",
      status: 500,
    });
  }
}, true);
