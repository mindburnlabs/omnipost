
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { getAIProviderSystem } from '@/lib/ai-provider-system';

// GET request - get available AI providers and models
export const GET = requestMiddleware(async (request, context) => {
  try {
    const aiSystem = await getAIProviderSystem();
    const providers = aiSystem.getAvailableProviders();
    
    // Sort providers by tier (Tier 1 first, then alphabetically)
    const sortedProviders = Object.values(providers).sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.display_name.localeCompare(b.display_name);
    });

    return createSuccessResponse({
      providers: sortedProviders,
      tiers: {
        1: 'Direct vendors (recommended)',
        2: 'Aggregators (fallback options)'
      },
      modalities: ['text', 'image', 'audio', 'video'],
      capabilities: {
        text: ['chat', 'completion', 'embedding'],
        image: ['generate', 'edit', 'variation'],
        audio: ['stt', 'tts'],
        video: ['generate', 'edit', 'caption']
      }
    });
  } catch (error) {
    console.error('Failed to get AI providers:', error);
    return createErrorResponse({
      errorMessage: "Failed to get AI providers",
      status: 500,
    });
  }
}, true);
