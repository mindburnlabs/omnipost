
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';

// GET request - get available AI models and user configurations
export const GET = requestMiddleware(async (request, context) => {
  try {
    const userId = parseInt(context.payload?.sub || '0');
    const aiService = await getAIService();
    
    // Get available providers (alphabetically ordered)
    const providers = aiService.getAvailableProviders();
    const sortedProviders = Object.values(providers).sort((a, b) => 
      a.display_name.localeCompare(b.display_name)
    );
    
    // Get user's current configuration
    let userConfig;
    if (userId) {
      userConfig = await aiService.getUserConfiguration(userId);
    } else {
      userConfig = {
        provider: 'gemini',
        api_key: process.env.GEMINI_API_KEY ? 'configured' : '',
        model: 'models/gemini-2.5-pro'
      };
    }
    
    return createSuccessResponse({
      availableProviders: sortedProviders,
      currentConfiguration: {
        provider: userConfig.provider,
        api_key: userConfig.api_key ? 'configured' : '',
        model: userConfig.model,
        error: userConfig.error
      },
      systemDefaults: {
        gemini: {
          available: !!process.env.GEMINI_API_KEY,
          model: 'models/gemini-2.5-pro'
        },
        openrouter: {
          available: !!process.env.OPENROUTER_API_KEY,
          model: 'deepseek/deepseek-chat-v3.1:free'
        }
      }
    });
  } catch (error) {
    console.error('AI models error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Failed to get AI models",
      status: 500,
    });
  }
}, true);
