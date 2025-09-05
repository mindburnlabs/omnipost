
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIProviderSystem } from '@/lib/ai-provider-system';
import { z } from 'zod';

const addKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  label: z.string().min(1, 'Label is required'),
  api_key: z.string().min(1, 'API key is required'),
  scopes: z.object({
    text: z.boolean().optional().default(true),
    image: z.boolean().optional().default(false),
    audio: z.boolean().optional().default(false),
    video: z.boolean().optional().default(false)
  }).optional(),
  monthly_budget_usd: z.number().min(0).optional().default(100),
  monthly_token_limit: z.number().min(0).optional().default(1000000),
  monthly_request_limit: z.number().min(0).optional().default(10000)
});

// GET request - get user's AI provider keys
export const GET = requestMiddleware(async (request, context) => {
  try {
    const userId = parseInt(context.payload?.sub || '0');
    const url = new URL(request.url);
    const workspaceId = parseInt(url.searchParams.get('workspace_id') || '1');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const aiSystem = await getAIProviderSystem();
    const keys = await aiSystem.getProviderKeys(userId, workspaceId);
    
    // Mask API keys for client response
    const maskedKeys = keys.map(key => ({
      ...key,
      encrypted_api_key: undefined, // Never send to client
      api_key_preview: `${'•'.repeat(Math.max(0, key.key_last_four.length - 4))}${key.key_last_four}`,
      last_verified: key.last_verified_at,
      is_verified: key.status === 'active'
    }));

    return createSuccessResponse({
      keys: maskedKeys,
      total_keys: keys.length,
      active_keys: keys.filter(k => k.status === 'active').length
    });
  } catch (error) {
    console.error('Failed to get AI keys:', error);
    return createErrorResponse({
      errorMessage: "Failed to get AI keys",
      status: 500,
    });
  }
}, true);

// POST request - add new AI provider key
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = addKeySchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    const workspaceId = parseInt(body.workspace_id || '1');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const aiSystem = await getAIProviderSystem();
    
    const providerKey = await aiSystem.addProviderKey(
      userId,
      workspaceId,
      validatedData.provider,
      validatedData.label,
      validatedData.api_key,
      validatedData.scopes,
      {
        monthly_budget_usd: validatedData.monthly_budget_usd,
        monthly_token_limit: validatedData.monthly_token_limit,
        monthly_request_limit: validatedData.monthly_request_limit
      }
    );

    // Return masked key data
    const maskedKey = {
      ...providerKey,
      encrypted_api_key: undefined,
      api_key_preview: `${'•'.repeat(Math.max(0, providerKey.key_last_four.length - 4))}${providerKey.key_last_four}`,
      last_verified: providerKey.last_verified_at,
      is_verified: providerKey.status === 'active'
    };

    return createSuccessResponse(maskedKey, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('Failed to add AI key:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Failed to add AI key",
      status: 500,
    });
  }
}, true);
