
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { testAllConnections } from '@/lib/platform-integrations';
import { PlatformConnection } from '@/types/omnipost';

// POST request - test publish without actually publishing
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
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    
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

    // Get selected platform connections
    const selectedPlatformIds = existing.metadata?.platforms || [];
    if (selectedPlatformIds.length === 0) {
      return createErrorResponse({
        errorMessage: "No platforms selected for this post",
        status: 400,
      });
    }

    const connections: PlatformConnection[] = [];
    for (const platformId of selectedPlatformIds) {
      const connection = await connectionsCrud.findById(platformId);
      if (connection) {
        connections.push(connection);
      }
    }

    if (connections.length === 0) {
      return createErrorResponse({
        errorMessage: "No platform connections found",
        status: 400,
      });
    }

    // Test all connections
    const testResults = await testAllConnections(connections);
    
    const allSuccessful = testResults.every(result => result.result.success);
    const failedTests = testResults.filter(result => !result.result.success);

    return createSuccessResponse({
      post_id: existing.id,
      post_title: existing.title || 'Untitled Post',
      platforms_tested: connections.length,
      all_connections_working: allSuccessful,
      test_results: testResults.map(test => ({
        connection_id: test.connectionId,
        platform_type: connections.find(c => c.id === test.connectionId)?.platform_type,
        connection_name: connections.find(c => c.id === test.connectionId)?.connection_name,
        success: test.result.success,
        message: test.result.message
      })),
      ready_to_publish: allSuccessful,
      issues: failedTests.length > 0 ? failedTests.map(test => ({
        connection_id: test.connectionId,
        error: test.result.message
      })) : undefined
    });
  } catch (error) {
    console.error('Failed to test publish:', error);
    return createErrorResponse({
      errorMessage: "Failed to test publish",
      status: 500,
    });
  }
}, true);
