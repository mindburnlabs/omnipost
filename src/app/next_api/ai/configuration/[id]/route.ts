
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// PUT request - update AI configuration
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.indexOf('configuration') + 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Configuration ID is required",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const configsCrud = new CrudOperations("user_ai_configurations", context.token);
    
    // Check if configuration exists and user owns it
    const existing = await configsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Configuration not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }

    // If setting as default, unset other defaults
    if (body.is_default) {
      const user_id = context.payload?.sub;
      const existingDefaults = await configsCrud.findMany({ user_id, is_default: true });
      for (const config of existingDefaults) {
        if (config.id !== parseInt(id)) {
          await configsCrud.update(config.id, { is_default: false });
        }
      }
    }

    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    const data = await configsCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to update AI configuration:', error);
    return createErrorResponse({
      errorMessage: "Failed to update AI configuration",
      status: 500,
    });
  }
}, true);

// DELETE request - delete AI configuration
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.indexOf('configuration') + 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Configuration ID is required",
        status: 400,
      });
    }
    
    const configsCrud = new CrudOperations("user_ai_configurations", context.token);
    
    // Check if configuration exists and user owns it
    const existing = await configsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Configuration not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const data = await configsCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete AI configuration:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete AI configuration",
      status: 500,
    });
  }
}, true);
