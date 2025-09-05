
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// GET request - get post validations
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const postId = pathSegments[pathSegments.indexOf('content-validation') + 1];
    
    if (!postId) {
      return createErrorResponse({
        errorMessage: "Post ID is required",
        status: 400,
      });
    }
    
    const postsCrud = new CrudOperations("posts", context.token);
    const validationsCrud = new CrudOperations("content_validations", context.token);
    
    // Check if post exists and user owns it
    const post = await postsCrud.findById(postId);
    if (!post) {
      return createErrorResponse({
        errorMessage: "Post not found",
        status: 404,
      });
    }
    
    if (post.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }
    
    const validations = await validationsCrud.findMany(
      { post_id: parseInt(postId) },
      {
        orderBy: {
          column: 'created_at',
          direction: 'desc'
        }
      }
    );
    
    return createSuccessResponse(validations);
  } catch (error) {
    console.error('Failed to get validations:', error);
    return createErrorResponse({
      errorMessage: "Failed to get validations",
      status: 500,
    });
  }
}, true);
