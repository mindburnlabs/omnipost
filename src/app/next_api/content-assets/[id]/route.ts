
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// GET request - fetch single content asset
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Asset ID is required",
        status: 400,
      });
    }
    
    const assetsCrud = new CrudOperations("content_assets", context.token);
    const asset = await assetsCrud.findById(id);
    
    if (!asset) {
      return createErrorResponse({
        errorMessage: "Asset not found",
        status: 404,
      });
    }
    
    // Check if user owns this asset
    if (asset.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    return createSuccessResponse(asset);
  } catch (error) {
    console.error('Failed to fetch content asset:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch content asset",
      status: 500,
    });
  }
}, true);

// DELETE request - delete content asset
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Asset ID is required",
        status: 400,
      });
    }
    
    const assetsCrud = new CrudOperations("content_assets", context.token);
    
    // Check if asset exists and user owns it
    const existing = await assetsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Asset not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    // In a real implementation, you'd also delete from cloud storage
    const data = await assetsCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete content asset:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete content asset",
      status: 500,
    });
  }
}, true);
