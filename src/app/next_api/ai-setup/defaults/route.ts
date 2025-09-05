
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIProviderSystem } from '@/lib/ai-provider-system';

// POST request - setup default aliases for workspace
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const userId = parseInt(context.payload?.sub || '0');
    const workspaceId = parseInt(body.workspace_id || '1');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const aiSystem = await getAIProviderSystem();
    await aiSystem.setupDefaultAliases(userId, workspaceId);

    return createSuccessResponse({
      message: 'Default AI aliases created successfully',
      aliases_created: [
        'default-writer',
        'fast-drafts', 
        'image-hero'
      ],
      next_steps: [
        'Add your API keys in Settings → AI Keys',
        'Verify your keys are working',
        'Customize alias fallback chains if needed'
      ]
    });
  } catch (error) {
    console.error('Failed to setup default aliases:', error);
    return createErrorResponse({
      errorMessage: "Failed to setup default aliases",
      status: 500,
    });
  }
}, true);
