
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";

// POST request - seed AI providers catalog
export const POST = requestMiddleware(async (request, context) => {
  try {
    // Only allow admin users to seed providers
    if (!context.payload?.isAdmin) {
      return createErrorResponse({
        errorMessage: "Admin access required",
        status: 403,
      });
    }

    const providersCrud = new CrudOperations('ai_providers', context.token);
    
    const providers = [
      {
        name: 'openai',
        display_name: 'OpenAI',
        description: 'Leading AI provider with GPT models and DALL-E',
        api_base_url: 'https://api.openai.com/v1',
        supported_features: {
          chat: true,
          completion: true,
          embedding: true,
          image_generation: true
        },
        default_models: {
          text: 'gpt-4',
          image: 'dall-e-3'
        },
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text', 'image'],
        pricing_model: {
          text: { input: 0.01, output: 0.03, unit: '1k_tokens' },
          image: { cost: 0.04, unit: 'image' }
        },
        rate_limits: {
          requests_per_minute: 3500,
          tokens_per_minute: 90000
        },
        data_residency: 'GLOBAL',
        is_active: true,
        sort_order: 1
      },
      {
        name: 'anthropic',
        display_name: 'Anthropic',
        description: 'Claude models for advanced reasoning and analysis',
        api_base_url: 'https://api.anthropic.com/v1',
        supported_features: {
          chat: true,
          completion: true
        },
        default_models: {
          text: 'claude-3-5-sonnet-20241022'
        },
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        pricing_model: {
          text: { input: 0.003, output: 0.015, unit: '1k_tokens' }
        },
        rate_limits: {
          requests_per_minute: 1000,
          tokens_per_minute: 40000
        },
        data_residency: 'GLOBAL',
        is_active: true,
        sort_order: 2
      },
      {
        name: 'google',
        display_name: 'Google',
        description: 'Gemini models for multimodal AI capabilities',
        api_base_url: 'https://generativelanguage.googleapis.com/v1beta',
        supported_features: {
          chat: true,
          completion: true,
          embedding: true,
          image_analysis: true
        },
        default_models: {
          text: 'gemini-1.5-pro',
          image: 'gemini-1.5-pro-vision'
        },
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text', 'image'],
        pricing_model: {
          text: { input: 0.00125, output: 0.005, unit: '1k_tokens' }
        },
        rate_limits: {
          requests_per_minute: 300,
          tokens_per_minute: 32000
        },
        data_residency: 'GLOBAL',
        is_active: true,
        sort_order: 3
      },
      {
        name: 'mistral',
        display_name: 'Mistral AI',
        description: 'European AI provider with efficient language models',
        api_base_url: 'https://api.mistral.ai/v1',
        supported_features: {
          chat: true,
          completion: true
        },
        default_models: {
          text: 'mistral-large-latest'
        },
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        pricing_model: {
          text: { input: 0.002, output: 0.006, unit: '1k_tokens' }
        },
        rate_limits: {
          requests_per_minute: 1000,
          tokens_per_minute: 30000
        },
        data_residency: 'EU',
        is_active: true,
        sort_order: 4
      },
      {
        name: 'groq',
        display_name: 'Groq',
        description: 'Ultra-fast inference for Llama and Mixtral models',
        api_base_url: 'https://api.groq.com/openai/v1',
        supported_features: {
          chat: true,
          completion: true
        },
        default_models: {
          text: 'llama-3.1-70b-versatile'
        },
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        pricing_model: {
          text: { input: 0.00059, output: 0.00079, unit: '1k_tokens' }
        },
        rate_limits: {
          requests_per_minute: 30,
          tokens_per_minute: 6000
        },
        data_residency: 'US',
        is_active: true,
        sort_order: 5
      },
      {
        name: 'zhipu',
        display_name: 'Zhipu AI',
        description: 'GLM models with strong Chinese language capabilities',
        api_base_url: 'https://open.bigmodel.cn/api/paas/v4',
        supported_features: {
          chat: true,
          completion: true
        },
        default_models: {
          text: 'glm-4-plus'
        },
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        pricing_model: {
          text: { input: 0.001, output: 0.002, unit: '1k_tokens' }
        },
        rate_limits: {
          requests_per_minute: 200,
          tokens_per_minute: 20000
        },
        data_residency: 'GLOBAL',
        is_active: true,
        sort_order: 6
      },
      {
        name: 'openrouter',
        display_name: 'OpenRouter',
        description: 'Access to multiple AI models through one API',
        api_base_url: 'https://openrouter.ai/api/v1',
        supported_features: {
          chat: true,
          completion: true
        },
        default_models: {
          text: 'openai/gpt-4'
        },
        tier: 2,
        is_aggregator: true,
        supported_modalities: ['text'],
        pricing_model: {
          text: { varies: true, note: 'Pricing varies by underlying model' }
        },
        rate_limits: {
          requests_per_minute: 200,
          tokens_per_minute: 20000
        },
        data_residency: 'GLOBAL',
        is_active: true,
        sort_order: 10
      },
      {
        name: 'replicate',
        display_name: 'Replicate',
        description: 'Open source models for image and video generation',
        api_base_url: 'https://api.replicate.com/v1',
        supported_features: {
          image_generation: true,
          video_generation: true
        },
        default_models: {
          image: 'stability-ai/sdxl',
          video: 'anotherjesse/zeroscope-v2-xl'
        },
        tier: 2,
        is_aggregator: true,
        supported_modalities: ['image', 'video'],
        pricing_model: {
          image: { cost: 0.0055, unit: 'image' },
          video: { cost: 0.0044, unit: 'second' }
        },
        rate_limits: {
          requests_per_minute: 50
        },
        data_residency: 'US',
        is_active: true,
        sort_order: 11
      }
    ];

    let seededCount = 0;
    for (const providerData of providers) {
      try {
        // Check if provider already exists
        const existing = await providersCrud.findMany({ name: providerData.name });
        if (existing.length === 0) {
          await providersCrud.create({
            ...providerData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          seededCount++;
        }
      } catch (error) {
        console.warn(`Failed to seed provider ${providerData.name}:`, error);
      }
    }

    return createSuccessResponse({
      message: `AI providers catalog seeded successfully`,
      providers_seeded: seededCount,
      total_providers: providers.length,
      tiers: {
        1: providers.filter(p => p.tier === 1).length,
        2: providers.filter(p => p.tier === 2).length
      }
    });
  } catch (error) {
    console.error('Failed to seed AI providers:', error);
    return createErrorResponse({
      errorMessage: "Failed to seed AI providers catalog",
      status: 500,
    });
  }
}, true);
