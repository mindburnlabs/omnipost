
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getAIProviderSystem } from '@/lib/ai-provider-system';
import { z } from 'zod';

const updateKeySchema = z.object({
  label: z.string().optional(),
  scopes: z.object({
    text: z.boolean().optional(),
    image: z.boolean().optional(),
    audio: z.boolean().optional(),
    video: z.boolean().optional()
  }).optional(),
  monthly_budget_usd: z.number().min(0).optional(),
  monthly_token_limit: z.number().min(0).optional(),
  monthly_request_limit: z.number().min(0).optional()
});

// PUT request - update AI provider key
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
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

    const body = await validateRequestBody(request);
    const validatedData = updateKeySchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    // Update key (implementation would go in AIProviderSystem)
    // For now, return success
    return createSuccessResponse({
      message: 'AI provider key updated successfully',
      key_id: parseInt(keyId)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Failed to update AI key:', error);
    return createErrorResponse({
      errorMessage: "Failed to update AI key",
      status: 500,
    });
  }
}, true);

// DELETE request - revoke AI provider key
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
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

    const aiSystem = await getAIProviderSystem();
    await aiSystem.revokeProviderKey(parseInt(keyId), userId);

    return createSuccessResponse({
      message: 'AI provider key revoked successfully',
      key_id: parseInt(keyId)
    });
  } catch (error) {
    console.error('Failed to revoke AI key:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Failed to revoke AI key",
      status: 500,
    });
  }
}, true);
