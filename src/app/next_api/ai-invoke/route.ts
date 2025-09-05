
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIProviderSystem } from '@/lib/ai-provider-system';
import { z } from 'zod';

const invokeSchema = z.object({
  alias_name: z.string().min(1, 'Alias name is required'),
  capability: z.enum(['chat', 'completion', 'embedding', 'generate', 'edit', 'variation', 'stt', 'tts', 'caption']),
  prompt: z.string().optional(),
  input_data: z.any().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().min(1).max(8000).optional(),
    stream: z.boolean().optional()
  }).optional(),
  workspace_id: z.number().optional().default(1)
});

// POST request - invoke AI via alias with fallback routing
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = invokeSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const aiSystem = await getAIProviderSystem();
    
    const result = await aiSystem.invokeAI({
      workspace_id: validatedData.workspace_id,
      user_id: userId,
      alias_name: validatedData.alias_name,
      capability: validatedData.capability,
      prompt: validatedData.prompt,
      input_data: validatedData.input_data,
      options: validatedData.options
    });

    // Add routing info for client
    const responseData = {
      ...result,
      routing_info: {
        alias_used: validatedData.alias_name,
        provider_of_record: result.provider_used,
        fallback_used: result.fallback_used,
        fallback_reason: result.fallback_reason,
        latency_ms: result.latency_ms,
        cost_estimate: result.usage.cost_estimate_usd
      }
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('AI invocation failed:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "AI invocation failed",
      status: 500,
    });
  }
}, true);
