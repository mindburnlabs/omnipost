
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// PUT request - resolve scheduling conflict
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.indexOf('scheduling-conflicts') + 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Conflict ID is required",
        status: 400,
      });
    }
    
    const conflictsCrud = new CrudOperations("scheduling_conflicts", context.token);
    
    // Check if conflict exists and user owns it
    const existing = await conflictsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Conflict not found",
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
      resolved: true,
      updated_at: new Date().toISOString()
    };
    
    const data = await conflictsCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to resolve conflict:', error);
    return createErrorResponse({
      errorMessage: "Failed to resolve conflict",
      status: 500,
    });
  }
}, true);
