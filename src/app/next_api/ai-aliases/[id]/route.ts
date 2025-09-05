
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getAIProviderSystem } from '@/lib/ai-provider-system';
import { z } from 'zod';

const updateAliasSchema = z.object({
  display_name: z.string().optional(),
  primary_provider: z.string().optional(),
  primary_model: z.string().optional(),
  fallback_chain: z.array(z.object({
    provider: z.string(),
    model: z.string(),
    priority: z.number()
  })).optional(),
  routing_preference: z.enum(['quality', 'speed', 'cost']).optional(),
  allow_aggregators: z.boolean().optional(),
  is_active: z.boolean().optional()
});

// PUT request - update model alias
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const aliasId = pathSegments[pathSegments.indexOf('ai-aliases') + 1];
    
    if (!aliasId) {
      return createErrorResponse({
        errorMessage: "Alias ID is required",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const validatedData = updateAliasSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const aiSystem = await getAIProviderSystem();
    
    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );
    
    const updatedAlias = await aiSystem.updateModelAlias(
      parseInt(aliasId),
      userId,
      updateData
    );

    return createSuccessResponse(updatedAlias);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('Failed to update AI alias:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Failed to update AI alias",
      status: 500,
    });
  }
}, true);

// DELETE request - delete model alias
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const aliasId = pathSegments[pathSegments.indexOf('ai-aliases') + 1];
    
    if (!aliasId) {
      return createErrorResponse({
        errorMessage: "Alias ID is required",
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
    await aiSystem.updateModelAlias(parseInt(aliasId), userId, { is_active: false });

    return createSuccessResponse({
      message: 'Model alias deactivated successfully',
      alias_id: parseInt(aliasId)
    });
  } catch (error) {
    console.error('Failed to delete AI alias:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Failed to delete AI alias",
      status: 500,
    });
  }
}, true);
