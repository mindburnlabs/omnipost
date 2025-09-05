
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch user activities
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const activitiesCrud = new CrudOperations("user_activities", context.token);
    
    const filters = {
      user_id: context.payload?.sub
    };
    
    const data = await activitiesCrud.findMany(filters, { 
      limit: limit || 20, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch user activities:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch user activities",
      status: 500,
    });
  }
}, true);

// POST request - create user activity
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.activity_type || !body.activity_description) {
      return createErrorResponse({
        errorMessage: "Activity type and description are required",
        status: 400,
      });
    }
    
    const activitiesCrud = new CrudOperations("user_activities", context.token);
    const user_id = context.payload?.sub;
    
    const activityData = {
      ...body,
      user_id,
      metadata: body.metadata || {},
      created_at: new Date().toISOString()
    };
    
    const data = await activitiesCrud.create(activityData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create user activity:', error);
    return createErrorResponse({
      errorMessage: "Failed to create user activity",
      status: 500,
    });
  }
}, true);
