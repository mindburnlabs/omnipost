
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// GET request - fetch single content template
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Template ID is required",
        status: 400,
      });
    }
    
    const contentTemplatesCrud = new CrudOperations("content_templates", context.token);
    const contentTemplate = await contentTemplatesCrud.findById(id);
    
    if (!contentTemplate) {
      return createErrorResponse({
        errorMessage: "Template not found",
        status: 404,
      });
    }
    
    // Check if user owns this template
    if (contentTemplate.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    return createSuccessResponse(contentTemplate);
  } catch (error) {
    console.error('Failed to fetch content template:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch content template",
      status: 500,
    });
  }
}, true);

// PUT request - update content template
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Template ID is required",
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const contentTemplatesCrud = new CrudOperations("content_templates", context.token);
    
    // Check if template exists and user owns it
    const existingTemplate = await contentTemplatesCrud.findById(id);
    if (!existingTemplate) {
      return createErrorResponse({
        errorMessage: "Template not found",
        status: 404,
      });
    }
    
    if (existingTemplate.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    const data = await contentTemplatesCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to update content template:', error);
    return createErrorResponse({
      errorMessage: "Failed to update content template",
      status: 500,
    });
  }
}, true);

// DELETE request - delete content template
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Template ID is required",
        status: 400,
      });
    }
    
    const contentTemplatesCrud = new CrudOperations("content_templates", context.token);
    
    // Check if template exists and user owns it
    const existingTemplate = await contentTemplatesCrud.findById(id);
    if (!existingTemplate) {
      return createErrorResponse({
        errorMessage: "Template not found",
        status: 404,
      });
    }
    
    if (existingTemplate.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const data = await contentTemplatesCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete content template:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete content template",
      status: 500,
    });
  }
}, true);
