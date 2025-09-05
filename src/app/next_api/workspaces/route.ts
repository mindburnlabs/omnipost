
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch user workspaces
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const workspacesCrud = new CrudOperations("workspaces", context.token);
    
    const filters = {
      user_id: context.payload?.sub
    };
    
    const data = await workspacesCrud.findMany(filters, { 
      limit: limit || 10, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch workspaces",
      status: 500,
    });
  }
}, true);

// POST request - create workspace
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.slug) {
      return createErrorResponse({
        errorMessage: "Name and slug are required",
        status: 400,
      });
    }
    
    const workspacesCrud = new CrudOperations("workspaces", context.token);
    const user_id = context.payload?.sub;
    
    // Check if slug is unique
    const existingWorkspaces = await workspacesCrud.findMany({ slug: body.slug });
    if (existingWorkspaces.length > 0) {
      return createErrorResponse({
        errorMessage: "Workspace slug already exists",
        status: 409,
      });
    }
    
    const workspaceData = {
      ...body,
      user_id,
      settings: body.settings || {},
      is_demo: body.is_demo || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const data = await workspacesCrud.create(workspaceData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return createErrorResponse({
      errorMessage: "Failed to create workspace",
      status: 500,
    });
  }
}, true);
