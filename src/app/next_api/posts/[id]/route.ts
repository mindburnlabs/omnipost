
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// GET request - fetch single post
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Post ID is required",
        status: 400,
      });
    }
    
    const postsCrud = new CrudOperations("posts", context.token);
    const post = await postsCrud.findById(id);
    
    if (!post) {
      return createErrorResponse({
        errorMessage: "Post not found",
        status: 404,
      });
    }
    
    // Check if user owns this post
    if (post.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    return createSuccessResponse(post);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch post",
      status: 500,
    });
  }
}, true);

// PUT request - update post
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Post ID is required",
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const postsCrud = new CrudOperations("posts", context.token);
    
    // Check if post exists and user owns it
    const existing = await postsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Post not found",
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
    
    const data = await postsCrud.update(id, updateData);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to update post:', error);
    return createErrorResponse({
      errorMessage: "Failed to update post",
      status: 500,
    });
  }
}, true);

// DELETE request - delete post
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Post ID is required",
        status: 400,
      });
    }
    
    const postsCrud = new CrudOperations("posts", context.token);
    
    // Check if post exists and user owns it
    const existing = await postsCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Post not found",
        status: 404,
      });
    }
    
    if (existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const data = await postsCrud.delete(id);
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to delete post:', error);
    return createErrorResponse({
      errorMessage: "Failed to delete post",
      status: 500,
    });
  }
}, true);
