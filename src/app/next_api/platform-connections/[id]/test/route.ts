
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';

// POST request - test platform connection
export const POST = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.indexOf('platform-connections') + 1];
    
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
    
    // Mock connection test - in a real app, you'd test the actual API connection
    const testResult = {
      success: true,
      message: `${connection.platform_type} connection test successful`
    };
    
    // Update last_sync_at
    await connectionsCrud.update(id, {
      last_sync_at: new Date().toISOString(),
      connection_status: 'active',
      updated_at: new Date().toISOString()
    });
    
    return createSuccessResponse(testResult);
  } catch (error) {
    console.error('Failed to test platform connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to test platform connection",
      status: 500,
    });
  }
}, true);
