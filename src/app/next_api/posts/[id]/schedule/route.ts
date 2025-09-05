
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getPublishingEngine } from '@/lib/publishing-engine';

// PUT request - schedule post
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
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
    
    const body = await validateRequestBody(request);
    
    if (!body.scheduled_at) {
      return createErrorResponse({
        errorMessage: "Scheduled time is required",
        status: 400,
      });
    }

    const scheduledAt = new Date(body.scheduled_at);
    if (scheduledAt <= new Date()) {
      return createErrorResponse({
        errorMessage: "Scheduled time must be in the future",
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

    // Validate that post has content and platforms selected
    if (!existing.content?.trim()) {
      return createErrorResponse({
        errorMessage: "Post content is required",
        status: 400,
      });
    }

    const selectedPlatforms = existing.metadata?.platforms || [];
    if (selectedPlatforms.length === 0) {
      return createErrorResponse({
        errorMessage: "At least one platform must be selected",
        status: 400,
      });
    }

    // Use publishing engine to schedule the post
    const publishingEngine = await getPublishingEngine();
    await publishingEngine.schedulePost(parseInt(id), scheduledAt);
    
    // Return the updated post
    const updatedPost = await postsCrud.findById(id);
    return createSuccessResponse(updatedPost);
  } catch (error) {
    console.error('Failed to schedule post:', error);
    return createErrorResponse({
      errorMessage: "Failed to schedule post",
      status: 500,
    });
  }
}, true);
