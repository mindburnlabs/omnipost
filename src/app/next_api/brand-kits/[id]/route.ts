
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// GET request - fetch single brand kit
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Brand kit ID is required",
        status: 400,
      });
    }
    
    const brandKitsCrud = new CrudOperations("brand_kits", context.token);
    const brandKit = await brandKitsCrud.findById(id);
    
    if (!brandKit) {
      return createErrorResponse({
        errorMessage: "Brand kit not found",
        status: 404,
      });
    }
    
    // Check if user owns this brand kit
    if (brandKit.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    return createSuccessResponse(brandKit);
  } catch (error) {
    console.error('Failed to fetch brand kit:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch brand kit",
      status: 500,
    });
  }
}, true);

// PUT request - update brand kit
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Brand kit ID is required",
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const brandKitsCrud = new CrudOperations("brand_kits", context.token);
    
    // Check if brand kit exists and user owns it
    const existing = await brandKitsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Brand kit not found",
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
    
    const data = await brandKitsCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to update brand kit:', error);
    return createErrorResponse({
      errorMessage: "Failed to update brand kit",
      status: 500,
    });
  }
}, true);

// DELETE request - delete brand kit
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Brand kit ID is required",
        status: 400,
      });
    }
    
    const brandKitsCrud = new CrudOperations("brand_kits", context.token);
    
    // Check if brand kit exists and user owns it
    const existing = await brandKitsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Brand kit not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const data = await brandKitsCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete brand kit:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete brand kit",
      status: 500,
    });
  }
}, true);
