
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getPublishingEngine } from '@/lib/publishing-engine';

// POST request - retry failed post
export const POST = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.indexOf('posts') + 1];
    
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

    // Only allow retry for failed posts
    if (existing.status !== 'failed') {
      return createErrorResponse({
        errorMessage: "Only failed posts can be retried",
        status: 400,
      });
    }

    // Use publishing engine to retry the post
    const publishingEngine = await getPublishingEngine();
    await publishingEngine.retryFailedPost(parseInt(id));
    
    // Return the updated post
    const updatedPost = await postsCrud.findById(id);
    return createSuccessResponse(updatedPost);
  } catch (error) {
    console.error('Failed to retry post:', error);
    return createErrorResponse({
      errorMessage: "Failed to retry post",
      status: 500,
    });
  }
}, true);
