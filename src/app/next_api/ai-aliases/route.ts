
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIProviderSystem } from '@/lib/ai-provider-system';
import { z } from 'zod';

const createAliasSchema = z.object({
  alias_name: z.string().min(1, 'Alias name is required'),
  display_name: z.string().min(1, 'Display name is required'),
  modality: z.enum(['text', 'image', 'audio', 'video']),
  capability: z.enum(['chat', 'completion', 'embedding', 'generate', 'edit', 'variation', 'stt', 'tts', 'caption']),
  primary_provider: z.string().min(1, 'Primary provider is required'),
  primary_model: z.string().min(1, 'Primary model is required'),
  fallback_chain: z.array(z.object({
    provider: z.string(),
    model: z.string(),
    priority: z.number()
  })).optional().default([]),
  routing_preference: z.enum(['quality', 'speed', 'cost']).optional().default('quality'),
  allow_aggregators: z.boolean().optional().default(false)
});

// Helper function to get budget status
function getBudgetStatus(key: any): string {
  if (!key?.monthly_budget_usd) return 'no_limit';
  
  const usagePercent = (key.current_spend_usd || 0) / key.monthly_budget_usd * 100;
  
  if (usagePercent >= 100) return 'exceeded';
  if (usagePercent >= 80) return 'warning';
  return 'ok';
}

// GET request - get user's model aliases
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
    const aliases = await aiSystem.getModelAliases(userId, workspaceId);
    
    // Get provider keys to show budget status
    const keys = await aiSystem.getProviderKeys(userId, workspaceId);
    
    // Enhance aliases with budget and status info
    const enhancedAliases = aliases.map(alias => {
      const primaryKey = keys.find(k => k.provider_name === alias.primary_provider);
      const fallbackKeys = alias.fallback_chain.map(fallback => 
        keys.find(k => k.provider_name === fallback.provider)
      ).filter(Boolean);

      return {
        ...alias,
        primary_key_status: primaryKey?.status || 'missing',
        primary_budget_status: primaryKey ? getBudgetStatus(primaryKey) : 'no_key',
        fallback_status: fallbackKeys.map(key => ({
          provider: key!.provider_name,
          status: key!.status,
          budget_status: getBudgetStatus(key!)
        })),
        total_providers: 1 + alias.fallback_chain.length,
        healthy_providers: [primaryKey, ...fallbackKeys].filter(k => k?.status === 'active').length
      };
    });

    return createSuccessResponse({
      aliases: enhancedAliases,
      total_aliases: aliases.length,
      active_aliases: aliases.filter(a => a.is_active).length
    });
  } catch (error) {
    console.error('Failed to get AI aliases:', error);
    return createErrorResponse({
      errorMessage: "Failed to get AI aliases",
      status: 500,
    });
  }
}, true);

// POST request - create model alias
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createAliasSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    const workspaceId = parseInt(body.workspace_id || '1');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const aiSystem = await getAIProviderSystem();
    
    const alias = await aiSystem.createModelAlias(userId, workspaceId, {
      ...validatedData,
      is_active: true
    });

    return createSuccessResponse(alias, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('Failed to create AI alias:', error);
    return createErrorResponse({
      errorMessage: "Failed to create AI alias",
      status: 500,
    });
  }
}, true);
