
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// GET request - fetch single platform connection
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Connection ID is required",
        status: 400,
      });
    }
    
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const connection = await connectionsCrud.findById(id);
    
    if (!connection) {
      return createErrorResponse({
        errorMessage: "Connection not found",
        status: 404,
      });
    }
    
    // Check if user owns this connection
    if (connection.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    return createSuccessResponse(connection);
  } catch (error) {
    console.error('Failed to fetch platform connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch platform connection",
      status: 500,
    });
  }
}, true);

// PUT request - update platform connection
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Connection ID is required",
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    
    // Check if connection exists and user owns it
    const existing = await connectionsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Connection not found",
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
    
    const data = await connectionsCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to update platform connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to update platform connection",
      status: 500,
    });
  }
}, true);

// DELETE request - delete platform connection
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Connection ID is required",
        status: 400,
      });
    }
    
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    
    // Check if connection exists and user owns it
    const existing = await connectionsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Connection not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const data = await connectionsCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete platform connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete platform connection",
      status: 500,
    });
  }
}, true);
