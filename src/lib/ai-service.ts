
// Enhanced AI service using the new AI Provider System with alias-based routing
import { getAIProviderSystem, AIRequest } from './ai-provider-system';
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';

export interface AIGenerationRequest {
  prompt: string;
  alias?: string; // Use alias instead of direct provider
  provider?: 'gemini' | 'openrouter'; // Keep for backward compatibility
  model?: string;
  capability?: 'chat' | 'completion' | 'embedding' | 'generate' | 'edit' | 'variation';
  maxTokens?: number;
  temperature?: number;
  image?: string; // Base64 encoded image for image analysis
  userId?: number;
  workspaceId?: number;
}

export interface AIGenerationResponse {
  content: string;
  provider_used: string;
  model_used: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costEstimate: number;
  };
  routing_info?: {
    alias_used: string;
    fallback_used: boolean;
    fallback_reason?: string;
    latency_ms: number;
  };
}

export class AIService {
  private adminToken: string | null = null;

  async initialize() {
    this.adminToken = await generateAdminUserToken();
  }

  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const aiSystem = await getAIProviderSystem();
    
    // Use alias-based routing instead of direct provider calls
    const aliasName = request.alias || 'default-writer';
    const workspaceId = request.workspaceId || 1;
    const userId = request.userId || 1;

    try {
      const aiRequest: AIRequest = {
        workspace_id: workspaceId,
        user_id: userId,
        alias_name: aliasName,
        capability: request.capability || 'chat',
        prompt: request.prompt,
        input_data: request.image ? { image: request.image } : undefined,
        options: {
          temperature: request.temperature,
          max_tokens: request.maxTokens
        }
      };

      const response = await aiSystem.invokeAI(aiRequest);

      return {
        content: response.content || '',
        provider_used: response.provider_used,
        model_used: response.model_used,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.total_tokens,
          costEstimate: response.usage.cost_estimate_usd
        },
        routing_info: {
          alias_used: aliasName,
          fallback_used: response.fallback_used,
          fallback_reason: response.fallback_reason,
          latency_ms: response.latency_ms
        }
      };
    } catch (error) {
      console.error(`AI generation failed with alias ${aliasName}:`, error);
      
      // Fallback to development response in development
      if (process.env.NODE_ENV === 'development') {
        return {
          content: this.generateDevelopmentResponse(request.prompt),
          provider_used: 'development',
          model_used: 'development',
          usage: {
            promptTokens: request.prompt.length / 4,
            completionTokens: 50,
            totalTokens: (request.prompt.length / 4) + 50,
            costEstimate: 0
          },
          routing_info: {
            alias_used: aliasName,
            fallback_used: true,
            fallback_reason: 'Development mode fallback',
            latency_ms: 100
          }
        };
      }
      
      throw error;
    }
  }

  // Enhanced methods using alias routing
  async optimizeForPlatform(content: string, platform: 'discord' | 'telegram' | 'whop', userId?: number, workspaceId?: number): Promise<string> {
    const platformPrompts = {
      discord: `Optimize this content for Discord. Keep it engaging, use appropriate Discord formatting (bold **text**, italic *text*), and ensure it fits Discord's community vibe. Content: "${content}"`,
      telegram: `Optimize this content for Telegram. Make it clear, concise, and engaging. Use Telegram markdown formatting where appropriate. Content: "${content}"`,
      whop: `Optimize this content for a Whop community. Make it professional yet engaging, suitable for a creator economy platform. Content: "${content}"`
    };

    const response = await this.generateContent({
      prompt: platformPrompts[platform],
      alias: 'default-writer',
      capability: 'chat',
      temperature: 0.7,
      userId,
      workspaceId
    });

    return response.content;
  }

  async generateHashtags(content: string, count: number = 5, userId?: number, workspaceId?: number): Promise<string[]> {
    const prompt = `Generate ${count} relevant hashtags for this social media content. Return only the hashtags without the # symbol, one per line: "${content}"`;
    
    const response = await this.generateContent({
      prompt,
      alias: 'fast-drafts',
      capability: 'completion',
      temperature: 0.5,
      userId,
      workspaceId
    });

    return response.content
      .split('\n')
      .map(tag => tag.trim().replace('#', ''))
      .filter(tag => tag.length > 0)
      .slice(0, count);
  }

  async improveContent(content: string, instructions?: string, userId?: number, workspaceId?: number): Promise<string> {
    const prompt = instructions 
      ? `Improve this content based on these instructions: "${instructions}". Original content: "${content}"`
      : `Improve this social media content to make it more engaging, clear, and effective. Keep the core message but enhance the presentation: "${content}"`;

    const response = await this.generateContent({
      prompt,
      alias: 'default-writer',
      capability: 'chat',
      temperature: 0.7,
      userId,
      workspaceId
    });

    return response.content;
  }

  async generateContentIdeas(topic: string, platform?: string, count: number = 5, userId?: number, workspaceId?: number): Promise<string[]> {
    const platformText = platform ? ` for ${platform}` : '';
    const prompt = `Generate ${count} creative content ideas about "${topic}"${platformText}. Make them engaging and actionable. Return one idea per line.`;

    const response = await this.generateContent({
      prompt,
      alias: 'fast-drafts',
      capability: 'completion',
      temperature: 0.8,
      userId,
      workspaceId
    });

    return response.content
      .split('\n')
      .map(idea => idea.trim())
      .filter(idea => idea.length > 0)
      .slice(0, count);
  }

  async analyzeImage(imageBase64: string, prompt?: string, userId?: number, workspaceId?: number): Promise<string> {
    const analysisPrompt = prompt || 'Describe this image and suggest how it could be used for social media content.';

    const response = await this.generateContent({
      prompt: analysisPrompt,
      alias: 'image-hero', // Use image-specific alias
      capability: 'generate',
      image: imageBase64,
      userId,
      workspaceId
    });

    return response.content;
  }

  async generateABTestVariants(originalContent: string, count: number = 2, userId?: number, workspaceId?: number): Promise<string[]> {
    const prompt = `Create ${count} different variations of this social media content for A/B testing. Each variant should have a different approach (tone, structure, call-to-action, etc.) but convey the same core message. Return each variant separated by "---". Original content: "${originalContent}"`;

    const response = await this.generateContent({
      prompt,
      alias: 'default-writer',
      capability: 'chat',
      temperature: 0.8,
      userId,
      workspaceId
    });

    return response.content
      .split('---')
      .map(variant => variant.trim())
      .filter(variant => variant.length > 0)
      .slice(0, count);
  }

  // Legacy method for backward compatibility
  private generateDevelopmentResponse(prompt: string): string {
    if (prompt.toLowerCase().includes('improve')) {
      return "Here's an improved version of your content with better engagement and clarity. The message is now more compelling and includes a clear call-to-action.";
    }
    if (prompt.toLowerCase().includes('hashtag')) {
      return "socialmedia\ncontent\nmarketing\nengagement\ncommunity";
    }
    if (prompt.toLowerCase().includes('idea')) {
      return "1. Share behind-the-scenes content\n2. Ask engaging questions\n3. Share user testimonials\n4. Post educational tips\n5. Create interactive polls";
    }
    if (prompt.toLowerCase().includes('variant')) {
      return "Variant 1: Exciting news! We're launching something amazing.\n\n---\n\nVariant 2: Get ready for our biggest announcement yet!";
    }
    return "This is a development AI response. Configure your AI aliases and keys to get real responses.";
  }

  // Get available aliases for UI
  async getAvailableAliases(userId: number, workspaceId: number = 1): Promise<Array<{
    name: string;
    display_name: string;
    modality: string;
    capability: string;
    provider: string;
    status: string;
    budget_status: string;
  }>> {
    const aiSystem = await getAIProviderSystem();
    const aliases = await aiSystem.getModelAliases(userId, workspaceId);
    const keys = await aiSystem.getProviderKeys(userId, workspaceId);
    
    return aliases.map(alias => {
      const primaryKey = keys.find(k => k.provider_name === alias.primary_provider);
      
      return {
        name: alias.alias_name,
        display_name: alias.display_name,
        modality: alias.modality,
        capability: alias.capability,
        provider: alias.primary_provider,
        status: primaryKey?.status || 'missing_key',
        budget_status: primaryKey ? this.getBudgetStatus(primaryKey) : 'no_budget'
      };
    });
  }

  private getBudgetStatus(key: any): string {
    if (!key.monthly_budget_usd) return 'no_limit';
    
    const usagePercent = (key.current_spend_usd || 0) / key.monthly_budget_usd * 100;
    
    if (usagePercent >= 100) return 'exceeded';
    if (usagePercent >= 80) return 'warning';
    return 'ok';
  }

  // Get available providers for configuration
  getAvailableProviders(): Record<string, {
    name: string;
    display_name: string;
    models: Record<string, string>;
    features: string[];
  }> {
    return {
      gemini: {
        name: 'gemini',
        display_name: 'Google Gemini',
        models: {
          text: 'models/gemini-2.5-pro',
          image: 'models/gemini-2.5-flash-image-preview'
        },
        features: ['text_generation', 'image_analysis']
      },
      openrouter: {
        name: 'openrouter',
        display_name: 'OpenRouter',
        models: {
          text: 'deepseek/deepseek-chat-v3.1:free',
          alternative: 'z-ai/glm-4.5-air:free'
        },
        features: ['text_generation']
      }
    };
  }

  // Get user configuration
  async getUserConfiguration(userId: number): Promise<{
    provider: string;
    api_key: string;
    model: string;
    error?: string;
  }> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const configsCrud = new CrudOperations("user_ai_configurations"); // Use service role key only
      const configs = await configsCrud.findMany({ user_id: userId, is_default: true });
      
      if (configs.length > 0) {
        const config = configs[0];
        return {
          provider: config.provider_name,
          api_key: config.api_key ? 'configured' : '',
          model: config.selected_models?.text || '',
          error: config.validation_status === 'invalid' ? config.validation_error : undefined
        };
      }

      // Return system default
      return {
        provider: 'gemini',
        api_key: process.env.GEMINI_API_KEY ? 'configured' : '',
        model: 'models/gemini-2.5-pro',
        error: !process.env.GEMINI_API_KEY ? 'System default API key not configured' : undefined
      };
    } catch (error) {
      console.error('Failed to get user configuration:', error);
      return {
        provider: 'gemini',
        api_key: '',
        model: '',
        error: 'Failed to load configuration'
      };
    }
  }
}

// Global AI service instance
let aiService: AIService | null = null;

export async function getAIService(): Promise<AIService> {
  if (!aiService) {
    aiService = new AIService();
    await aiService.initialize();
  }
  return aiService;
}
