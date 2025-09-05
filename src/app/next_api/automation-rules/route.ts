
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch automation rules
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const rulesCrud = new CrudOperations("automation_rules", context.token);
    
    const filters = {
      user_id: context.payload?.sub
    };
    
    const data = await rulesCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch automation rules:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch automation rules",
      status: 500,
    });
  }
}, true);

// POST request - create automation rule
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.trigger_type || !body.actions) {
      return createErrorResponse({
        errorMessage: "Name, trigger type, and actions are required",
        status: 400,
      });
    }
    
    const rulesCrud = new CrudOperations("automation_rules", context.token);
    const user_id = context.payload?.sub;
    
    const ruleData = {
      ...body,
      user_id,
      trigger_conditions: body.trigger_conditions || {},
      is_active: body.is_active ?? true,
      run_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const data = await rulesCrud.create(ruleData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create automation rule:', error);
    return createErrorResponse({
      errorMessage: "Failed to create automation rule",
      status: 500,
    });
  }
}, true);
