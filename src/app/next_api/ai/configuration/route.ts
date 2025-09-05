

import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { z } from 'zod';

const configurationSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  api_key: z.string().min(1, 'API key is required'),
  model: z.string().optional(),
  is_default: z.boolean().optional().default(false)
});

// GET request - fetch user AI configurations
export const GET = requestMiddleware(async (request, context) => {
  try {
    const configsCrud = new CrudOperations("user_ai_configurations", context.token);
    const user_id = context.payload?.sub;
    
    if (!user_id) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const configurations = await configsCrud.findMany(
      { user_id, is_active: true },
      {
        orderBy: { column: 'provider_name', direction: 'asc' }
      }
    );

    // Get available providers (alphabetically ordered)
    const availableProviders = [
      {
        name: 'gemini',
        display_name: 'Google Gemini',
        models: {
          text: 'models/gemini-2.5-pro',
          image: 'models/gemini-2.5-flash-image-preview'
        },
        features: ['text_generation', 'image_analysis']
      },
      {
        name: 'openrouter',
        display_name: 'OpenRouter',
        models: {
          text: 'deepseek/deepseek-chat-v3.1:free',
          alternative: 'z-ai/glm-4.5-air:free'
        },
        features: ['text_generation']
      }
    ].sort((a, b) => a.display_name.localeCompare(b.display_name));

    // Get default configuration or system default
    let defaultConfig = configurations.find(config => config.is_default);
    
    if (!defaultConfig) {
      // Return system default
      defaultConfig = {
        provider: 'gemini',
        api_key: process.env.GEMINI_API_KEY || '',
        model: 'models/gemini-2.5-pro',
        error: !process.env.GEMINI_API_KEY ? 'System default API key not configured' : undefined
      };
    } else {
      defaultConfig = {
        provider: defaultConfig.provider_name,
        api_key: defaultConfig.api_key ? 'configured' : '',
        model: defaultConfig.selected_models?.text || '',
        error: undefined
      };
    }

    return createSuccessResponse({
      defaultConfiguration: defaultConfig,
      userConfigurations: configurations.map(config => ({
        id: config.id,
        provider: config.provider_name,
        api_key: config.api_key ? 'configured' : '',
        model: config.selected_models?.text || '',
        is_default: config.is_default,
        validation_status: config.validation_status,
        last_validated_at: config.last_validated_at
      })),
      availableProviders
    });
  } catch (error) {
    console.error('Failed to fetch AI configurations:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch AI configurations",
      status: 500,
    });
  }
}, true);

// POST request - create or update AI configuration
export const POST = requestMiddleware(async (request, context) => {
  let body: any = {};
  
  try {
    body = await validateRequestBody(request);
    const user_id = context.payload?.sub;
    
    if (!user_id) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    // Step 1: Validate provider selection
    if (!body.provider) {
      return createSuccessResponse({
        provider: '',
        api_key: '',
        model: '',
        error: 'Provider selection is required. Please choose from the available providers list.'
      });
    }

    // Validate provider is supported
    const supportedProviders = ['gemini', 'openrouter'];
    if (!supportedProviders.includes(body.provider)) {
      return createSuccessResponse({
        provider: body.provider,
        api_key: '',
        model: '',
        error: `Unsupported provider "${body.provider}". Please select from: ${supportedProviders.join(', ')}`
      });
    }

    // Step 2: Validate API key presence
    if (!body.api_key || body.api_key.trim().length === 0) {
      return createSuccessResponse({
        provider: body.provider,
        api_key: '',
        model: '',
        error: 'API key is required. Please enter your API key for the selected provider.'
      });
    }

    // Step 3: Validate API key format
    if (body.provider === 'gemini' && !body.api_key.startsWith('AIza')) {
      return createSuccessResponse({
        provider: body.provider,
        api_key: body.api_key,
        model: '',
        error: 'Invalid Gemini API key format. Gemini API keys should start with "AIza".'
      });
    }

    if (body.provider === 'openrouter' && !body.api_key.startsWith('sk-or-v1-')) {
      return createSuccessResponse({
        provider: body.provider,
        api_key: body.api_key,
        model: '',
        error: 'Invalid OpenRouter API key format. OpenRouter API keys should start with "sk-or-v1-".'
      });
    }

    // Step 4: Set default model if not provided
    let selectedModel = body.model;
    if (!selectedModel) {
      if (body.provider === 'gemini') {
        selectedModel = 'models/gemini-2.5-pro';
      } else if (body.provider === 'openrouter') {
        selectedModel = 'deepseek/deepseek-chat-v3.1:free';
      }
    }

    // Step 5: Test API key with actual request
    let validationStatus = 'pending';
    let validationError = null;

    try {
      await validateAPIKey(body.provider, body.api_key, selectedModel);
      validationStatus = 'valid';
    } catch (error) {
      validationStatus = 'invalid';
      validationError = error instanceof Error ? error.message : 'API key validation failed';
      
      return createSuccessResponse({
        provider: body.provider,
        api_key: body.api_key,
        model: selectedModel,
        error: `API key validation failed: ${validationError}. Please check your API key and try again.`
      });
    }

    // Step 6: Save configuration to database
    const configsCrud = new CrudOperations("user_ai_configurations", context.token);
    
    // If this is set as default, unset other defaults
    if (body.is_default) {
      const existingConfigs = await configsCrud.findMany({ user_id, is_default: true });
      for (const config of existingConfigs) {
        await configsCrud.update(config.id, { is_default: false });
      }
    }

    const configData = {
      user_id,
      provider_name: body.provider,
      api_key: body.api_key,
      selected_models: {
        text: selectedModel,
        image: body.provider === 'gemini' ? 'models/gemini-2.5-flash-image-preview' : undefined
      },
      is_default: body.is_default || false,
      is_active: true,
      last_validated_at: new Date().toISOString(),
      validation_status: validationStatus,
      validation_error: validationError,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const savedConfig = await configsCrud.create(configData);

    return createSuccessResponse({
      provider: body.provider,
      api_key: 'configured',
      model: selectedModel,
      error: undefined,
      id: savedConfig.id,
      validation_status: validationStatus
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createSuccessResponse({
        provider: body?.provider || '',
        api_key: body?.api_key || '',
        model: body?.model || '',
        error: error.errors[0].message
      });
    }
    
    console.error('AI configuration error:', error);
    return createErrorResponse({
      errorMessage: "Failed to save AI configuration",
      status: 500,
    });
  }
}, true);

// Helper function to validate API keys
async function validateAPIKey(provider: string, apiKey: string, model: string): Promise<void> {
  const timeout = 10000; // 10 second timeout

  switch (provider) {
    case 'gemini':
      const geminiController = new AbortController();
      const geminiTimeout = setTimeout(() => geminiController.abort(), timeout);
      
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }],
            generationConfig: { maxOutputTokens: 5 }
          }),
          signal: geminiController.signal
        });
        
        clearTimeout(geminiTimeout);
        
        if (!geminiResponse.ok) {
          const errorData = await geminiResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${geminiResponse.status}: Invalid API key or insufficient permissions`);
        }
      } catch (error) {
        clearTimeout(geminiTimeout);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - API key validation took too long');
        }
        throw error;
      }
      break;

    case 'openrouter':
      const openRouterController = new AbortController();
      const openRouterTimeout = setTimeout(() => openRouterController.abort(), timeout);
      
      try {
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
          }),
          signal: openRouterController.signal
        });
        
        clearTimeout(openRouterTimeout);
        
        if (!openRouterResponse.ok) {
          const errorData = await openRouterResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${openRouterResponse.status}: Invalid API key or insufficient permissions`);
        }
      } catch (error) {
        clearTimeout(openRouterTimeout);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - API key validation took too long');
        }
        throw error;
      }
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

