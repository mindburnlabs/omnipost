
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// POST request - validate post content
export const POST = requestMiddleware(async (request: NextRequest, context) => {
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
    
    // Run validations
    const validations = [];
    
    // Character count validation
    const totalLength = (post.title || '').length + post.content.length;
    validations.push({
      post_id: parseInt(postId),
      validation_type: 'character_count',
      validation_status: totalLength > 2000 ? 'warning' : 'passed',
      validation_message: `Content length: ${totalLength} characters`,
      validation_details: { character_count: totalLength },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Link validation
    const linkRegex = /https?:\/\/[^\s]+/g;
    const links = post.content.match(linkRegex) || [];
    if (links.length > 0) {
      validations.push({
        post_id: parseInt(postId),
        validation_type: 'link_check',
        validation_status: 'passed',
        validation_message: `Found ${links.length} link(s)`,
        validation_details: { links },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Save validations
    const savedValidations = [];
    for (const validation of validations) {
      const saved = await validationsCrud.create(validation);
      savedValidations.push(saved);
    }
    
    return createSuccessResponse(savedValidations);
  } catch (error) {
    console.error('Failed to validate post:', error);
    return createErrorResponse({
      errorMessage: "Failed to validate post",
      status: 500,
    });
  }
}, true);
