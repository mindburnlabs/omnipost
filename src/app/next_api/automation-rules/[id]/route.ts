
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// PUT request - update automation rule
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Rule ID is required",
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const rulesCrud = new CrudOperations("automation_rules", context.token);
    
    // Check if rule exists and user owns it
    const existing = await rulesCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Rule not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    const data = await rulesCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to update automation rule:', error);
    return createErrorResponse({
      errorMessage: "Failed to update automation rule",
      status: 500,
    });
  }
}, true);

// DELETE request - delete automation rule
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Rule ID is required",
        status: 400,
      });
    }
    
    const rulesCrud = new CrudOperations("automation_rules", context.token);
    
    // Check if rule exists and user owns it
    const existing = await rulesCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Rule not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const data = await rulesCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete automation rule:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete automation rule",
      status: 500,
    });
  }
}, true);
