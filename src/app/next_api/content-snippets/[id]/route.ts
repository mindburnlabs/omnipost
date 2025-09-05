
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// GET request - fetch single content snippet
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Snippet ID is required",
        status: 400,
      });
    }
    
    const snippetsCrud = new CrudOperations("content_snippets", context.token);
    const snippet = await snippetsCrud.findById(id);
    
    if (!snippet) {
      return createErrorResponse({
        errorMessage: "Snippet not found",
        status: 404,
      });
    }
    
    // Check if user owns this snippet
    if (snippet.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    return createSuccessResponse(snippet);
  } catch (error) {
    console.error('Failed to fetch content snippet:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch content snippet",
      status: 500,
    });
  }
}, true);

// PUT request - update content snippet
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Snippet ID is required",
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const snippetsCrud = new CrudOperations("content_snippets", context.token);
    
    // Check if snippet exists and user owns it
    const existing = await snippetsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Snippet not found",
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
    
    const data = await snippetsCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to update content snippet:', error);
    return createErrorResponse({
      errorMessage: "Failed to update content snippet",
      status: 500,
    });
  }
}, true);

// DELETE request - delete content snippet
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Snippet ID is required",
        status: 400,
      });
    }
    
    const snippetsCrud = new CrudOperations("content_snippets", context.token);
    
    // Check if snippet exists and user owns it
    const existing = await snippetsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Snippet not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const data = await snippetsCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete content snippet:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete content snippet",
      status: 500,
    });
  }
}, true);
