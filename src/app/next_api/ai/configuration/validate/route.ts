

import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { z } from 'zod';

const validateSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  api_key: z.string().min(1, 'API key is required'),
  model: z.string().optional()
});

// POST request - validate AI configuration
export const POST = requestMiddleware(async (request, context) => {
  let body: any = {};
  
  try {
    body = await validateRequestBody(request);
    
    // Step 1: Validate provider
    if (!body.provider) {
      return createSuccessResponse({
        provider: '',
        api_key: '',
        model: '',
        error: 'Provider selection is required. Please choose from the available providers list.'
      });
    }

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
    try {
      await testAPIKey(body.provider, body.api_key, selectedModel);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API key validation failed';
      return createSuccessResponse({
        provider: body.provider,
        api_key: body.api_key,
        model: selectedModel,
        error: `API key validation failed: ${errorMessage}. Please verify your API key is correct and has proper permissions.`
      });
    }

    // All validations passed
    return createSuccessResponse({
      provider: body.provider,
      api_key: body.api_key,
      model: selectedModel,
      error: undefined
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createSuccessResponse({
        provider: body?.provider || '',
        api_key: body?.api_key || '',
        model: body?.model || '',
        error: error.errors[0]?.message || "Validation error"
      });
    }
    
    console.error('AI configuration validation error:', error);
    return createErrorResponse({
      errorMessage: "Failed to validate AI configuration",
      status: 500,
    });
  }
}, true);

// Helper function to test API keys
async function testAPIKey(provider: string, apiKey: string, model: string): Promise<void> {
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

