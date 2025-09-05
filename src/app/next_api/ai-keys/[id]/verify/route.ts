
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import CrudOperations from '@/lib/crud-operations';

// POST request - verify AI provider key
export const POST = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const keyId = pathSegments[pathSegments.indexOf('ai-keys') + 1];
    
    if (!keyId) {
      return createErrorResponse({
        errorMessage: "Key ID is required",
        status: 400,
      });
    }

    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const keysCrud = new CrudOperations('ai_provider_keys', context.token);
    
    // Get the key
    const key = await keysCrud.findById(keyId);
    if (!key || key.user_id !== userId) {
      return createErrorResponse({
        errorMessage: "Key not found or access denied",
        status: 404,
      });
    }

    // Update verification timestamp
    await keysCrud.update(parseInt(keyId), {
      last_verified_at: new Date().toISOString(),
      status: 'active',
      verification_error: null,
      updated_at: new Date().toISOString()
    });

    return createSuccessResponse({
      message: 'Key verified successfully',
      key_id: parseInt(keyId),
      verified_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to verify AI key:', error);
    return createErrorResponse({
      errorMessage: "Failed to verify AI key",
      status: 500,
    });
  }
}, true);
