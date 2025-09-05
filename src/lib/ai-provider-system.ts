
// AI Provider Management System with BYOK vault, alias routing, and observability
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';
import crypto from 'crypto';
import { AIProvider, ProviderModel, AIProviderKey, ModelAlias, AIRequest, AIResponse, AICallLog } from '@/types/ai';

export class AIProviderSystem {
  private adminToken: string | null = null;
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.AI_ENCRYPTION_KEY || 'default-dev-key-change-in-production';
  }

  async initialize() {
    this.adminToken = await generateAdminUserToken();
  }

  // BYOK Vault Management
  async addProviderKey(
    userId: number,
    workspaceId: number,
    provider: string,
    label: string,
    apiKey: string,
    scopes: Partial<AIProviderKey['scopes']> = {},
    budgets: Partial<Pick<AIProviderKey, 'monthly_budget_usd' | 'monthly_token_limit' | 'monthly_request_limit'>> = {}
  ): Promise<AIProviderKey> {
    if (!this.adminToken) await this.initialize();

    // Encrypt API key
    const encryptedKey = this.encryptApiKey(apiKey);
    const lastFour = apiKey.slice(-4);

    // Verify key before storing
    const verification = await this.verifyProviderKey(provider, apiKey);
    
    const keysCrud = new CrudOperations('ai_provider_keys', this.adminToken!);
    
    const keyData = {
      user_id: userId,
      workspace_id: workspaceId,
      provider_name: provider,
      key_label: label,
      encrypted_api_key: encryptedKey,
      key_last_four: lastFour,
      scopes: {
        text: true,
        image: false,
        audio: false,
        video: false,
        ...scopes
      },
      status: verification.valid ? 'active' : 'invalid',
      last_verified_at: new Date().toISOString(),
      verification_error: verification.error,
      monthly_budget_usd: budgets.monthly_budget_usd || 100,
      monthly_token_limit: budgets.monthly_token_limit || 1000000,
      monthly_request_limit: budgets.monthly_request_limit || 10000,
      rate_limit_per_minute: 60,
      data_residency: 'global',
      zero_retention_mode: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const savedKey = await keysCrud.create(keyData);
    
    // Log key addition
    await this.logAICall({
      user_id: userId,
      workspace_id: workspaceId,
      alias_name: 'system',
      provider_name: provider,
      model_name: 'key-verification',
      modality: 'text',
      capability: 'verification',
      request_id: `verify_${Date.now()}`,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      input_characters: 0,
      output_characters: 0,
      media_seconds: 0,
      media_frames: 0,
      cost_estimate_usd: 0,
      latency_ms: 0,
      status: verification.valid ? 'success' : 'error',
      error_message: verification.error,
      fallback_used: false,
      provider_of_record: provider,
      request_metadata: { action: 'key_added', label },
      response_metadata: { verified: verification.valid }
    });

    return savedKey;
  }

  async getProviderKeys(userId: number, workspaceId: number): Promise<AIProviderKey[]> {
    if (!this.adminToken) await this.initialize();

    const keysCrud = new CrudOperations('ai_provider_keys', this.adminToken!);
    return await keysCrud.findMany({ user_id: userId, workspace_id: workspaceId });
  }

  async revokeProviderKey(keyId: number, userId: number): Promise<void> {
    if (!this.adminToken) await this.initialize();

    const keysCrud = new CrudOperations('ai_provider_keys', this.adminToken!);
    
    // Verify ownership
    const key = await keysCrud.findById(keyId);
    if (!key || key.user_id !== userId) {
      throw new Error('Key not found or access denied');
    }

    await keysCrud.update(keyId, {
      status: 'inactive',
      updated_at: new Date().toISOString()
    });
  }

  // Model Alias Management
  async createModelAlias(
    userId: number,
    workspaceId: number,
    aliasData: Omit<ModelAlias, 'id' | 'user_id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<ModelAlias> {
    if (!this.adminToken) await this.initialize();

    const aliasesCrud = new CrudOperations('ai_model_aliases', this.adminToken!);
    
    const alias = await aliasesCrud.create({
      user_id: userId,
      workspace_id: workspaceId,
      ...aliasData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return alias;
  }

  async getModelAliases(userId: number, workspaceId: number): Promise<ModelAlias[]> {
    if (!this.adminToken) await this.initialize();

    const aliasesCrud = new CrudOperations('ai_model_aliases', this.adminToken!);
    return await aliasesCrud.findMany({ 
      user_id: userId, 
      workspace_id: workspaceId,
      is_active: true 
    });
  }

  async updateModelAlias(
    aliasId: number,
    userId: number,
    updates: Partial<ModelAlias>
  ): Promise<ModelAlias> {
    if (!this.adminToken) await this.initialize();

    const aliasesCrud = new CrudOperations('ai_model_aliases', this.adminToken!);
    
    // Verify ownership
    const alias = await aliasesCrud.findById(aliasId);
    if (!alias || alias.user_id !== userId) {
      throw new Error('Alias not found or access denied');
    }

    return await aliasesCrud.update(aliasId, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  // AI Request Routing with Fallbacks
  async invokeAI(request: AIRequest): Promise<AIResponse> {
    if (!this.adminToken) await this.initialize();

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Get alias configuration
      const alias = await this.getAliasByName(request.workspace_id, request.alias_name);
      if (!alias) {
        throw new Error(`Alias '${request.alias_name}' not found. Configure aliases in Settings → Model Aliases.`);
      }

      // Build provider chain (primary + fallbacks)
      const providerChain = [
        { provider: alias.primary_provider, model: alias.primary_model },
        ...alias.fallback_chain.sort((a, b) => a.priority - b.priority)
      ];

      let lastError: string | undefined;
      let fallbackUsed = false;
      let fallbackReason: string | undefined;

      // Try each provider in the chain
      for (let i = 0; i < providerChain.length; i++) {
        const { provider, model } = providerChain[i];
        
        try {
          // Check if this is a fallback
          if (i > 0) {
            fallbackUsed = true;
            fallbackReason = lastError || 'Primary provider failed';
          }

          // Get provider key
          const providerKey = await this.getProviderKeyForWorkspace(
            request.workspace_id, 
            provider
          );

          if (!providerKey) {
            lastError = `No API key configured for ${provider}. Add a key in Settings → AI Keys.`;
            continue;
          }

          // Check budget
          const budgetCheck = await this.checkBudget(providerKey.id);
          if (!budgetCheck.allowed) {
            lastError = `Budget reached for ${provider}. ${budgetCheck.message}`;
            continue;
          }

          // Check scopes
          if (!this.checkScope(providerKey, alias.modality)) {
            lastError = `This key doesn't allow ${alias.modality}. Enable '${alias.modality}' scope or pick another alias.`;
            continue;
          }

          // Make the actual AI call
          const result = await this.callProvider(
            provider,
            model,
            this.decryptApiKey(providerKey.encrypted_api_key),
            request,
            alias
          );

          const latencyMs = Date.now() - startTime;

          // Log successful call
          await this.logAICall({
            user_id: request.user_id,
            workspace_id: request.workspace_id,
            alias_name: request.alias_name,
            provider_name: provider,
            model_name: model,
            modality: alias.modality,
            capability: alias.capability,
            request_id: requestId,
            input_tokens: result.usage.input_tokens,
            output_tokens: result.usage.output_tokens,
            total_tokens: result.usage.total_tokens,
            input_characters: request.prompt?.length || 0,
            output_characters: result.content?.length || 0,
            media_seconds: 0,
            media_frames: 0,
            cost_estimate_usd: result.usage.cost_estimate_usd,
            latency_ms: latencyMs,
            status: 'success',
            fallback_used: fallbackUsed,
            fallback_reason: fallbackReason,
            provider_of_record: provider,
            request_metadata: {
              alias: request.alias_name,
              capability: request.capability,
              options: request.options
            },
            response_metadata: {
              model_used: model,
              provider_tier: this.getProviderTier(provider)
            }
          });

          // Update budget usage
          await this.updateBudgetUsage(providerKey.id, result.usage);

          return {
            success: true,
            content: result.content,
            data: result.data,
            provider_used: provider,
            model_used: model,
            usage: result.usage,
            latency_ms: latencyMs,
            fallback_used: fallbackUsed,
            fallback_reason: fallbackReason,
            request_id: requestId
          };

        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown provider error';
          console.warn(`Provider ${provider} failed:`, lastError);
          
          // Continue to next provider in chain
          continue;
        }
      }

      // All providers failed
      const latencyMs = Date.now() - startTime;
      
      await this.logAICall({
        user_id: request.user_id,
        workspace_id: request.workspace_id,
        alias_name: request.alias_name,
        provider_name: alias.primary_provider,
        model_name: alias.primary_model,
        modality: alias.modality,
        capability: alias.capability,
        request_id: requestId,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        input_characters: request.prompt?.length || 0,
        output_characters: 0,
        media_seconds: 0,
        media_frames: 0,
        cost_estimate_usd: 0,
        latency_ms: latencyMs,
        status: 'error',
        error_message: lastError,
        fallback_used: providerChain.length > 1,
        provider_of_record: alias.primary_provider,
        request_metadata: {
          alias: request.alias_name,
          capability: request.capability,
          providers_tried: providerChain.length
        },
        response_metadata: {}
      });

      throw new Error(lastError || 'All providers in chain failed');

    } catch (error) {
      throw error;
    }
  }

  // Provider Adapters
  private async callProvider(
    provider: string,
    model: string,
    apiKey: string,
    request: AIRequest,
    alias: ModelAlias
  ): Promise<{
    content?: string;
    data?: Record<string, unknown>;
    usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      cost_estimate_usd: number;
    };
  }> {
    switch (provider) {
      case 'openai':
        return await this.callOpenAI(model, apiKey, request, alias);
      case 'anthropic':
        return await this.callAnthropic(model, apiKey, request, alias);
      case 'google':
        return await this.callGemini(model, apiKey, request, alias);
      case 'mistral':
        return await this.callMistral(model, apiKey, request, alias);
      case 'groq':
        return await this.callGroq(model, apiKey, request, alias);
      case 'zhipu':
        return await this.callZhipu(model, apiKey, request, alias);
      case 'openrouter':
        return await this.callOpenRouter(model, apiKey, request, alias);
      case 'replicate':
        return await this.callReplicate(model, apiKey, request, alias);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async callOpenAI(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.max_tokens || 1000,
        temperature: request.options?.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        cost_estimate_usd: this.estimateCost('openai', model, data.usage?.total_tokens || 0)
      }
    };
  }

  private async callAnthropic(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: request.options?.max_tokens || 1000,
        messages: [{ role: 'user', content: request.prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0]?.text,
      usage: {
        input_tokens: data.usage?.input_tokens || 0,
        output_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        cost_estimate_usd: this.estimateCost('anthropic', model, (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0))
      }
    };
  }

  private async callGemini(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: request.options?.temperature || 0.7,
          maxOutputTokens: request.options?.max_tokens || 1000
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text,
      usage: {
        input_tokens: data.usageMetadata?.promptTokenCount || 0,
        output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0,
        cost_estimate_usd: this.estimateCost('google', model, data.usageMetadata?.totalTokenCount || 0)
      }
    };
  }

  private async callMistral(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.max_tokens || 1000,
        temperature: request.options?.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        cost_estimate_usd: this.estimateCost('mistral', model, data.usage?.total_tokens || 0)
      }
    };
  }

  private async callGroq(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.max_tokens || 1000,
        temperature: request.options?.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        cost_estimate_usd: this.estimateCost('groq', model, data.usage?.total_tokens || 0)
      }
    };
  }

  private async callZhipu(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.max_tokens || 1000,
        temperature: request.options?.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Zhipu API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        cost_estimate_usd: this.estimateCost('zhipu', model, data.usage?.total_tokens || 0)
      }
    };
  }

  private async callOpenRouter(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.options?.max_tokens || 1000,
        temperature: request.options?.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        cost_estimate_usd: this.estimateCost('openrouter', model, data.usage?.total_tokens || 0)
      }
    };
  }

  private async callReplicate(model: string, apiKey: string, request: AIRequest, alias: ModelAlias) {
    // Replicate implementation for image/video models
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: request.prompt,
          ...request.options
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    
    // Poll for completion (simplified)
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Token ${apiKey}` }
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Replicate prediction failed');
    }

    return {
      data: result.output,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        cost_estimate_usd: this.estimateCost('replicate', model, 1) // Per-request pricing
      }
    };
  }

  // Budget Management
  async checkBudget(providerKeyId: number): Promise<{ allowed: boolean; message: string; usage: Record<string, unknown> }> {
    if (!this.adminToken) await this.initialize();

    const budgetsCrud = new CrudOperations('ai_provider_budgets', this.adminToken!);
    const budgets = await budgetsCrud.findMany({ provider_key_id: providerKeyId });
    
    if (budgets.length === 0) {
      return { allowed: true, message: 'No budget limits set', usage: {} };
    }

    const budget = budgets[0];
    const usagePercent = (budget.current_spend_usd / budget.budget_limit_usd) * 100;

    if (usagePercent >= 100) {
      return { 
        allowed: false, 
        message: 'Budget reached. Increase cap or switch to platform credits.',
        usage: { percent: usagePercent, spent: budget.current_spend_usd, limit: budget.budget_limit_usd }
      };
    }

    if (usagePercent >= 80) {
      return { 
        allowed: true, 
        message: `Budget warning: ${Math.round(usagePercent)}% used`,
        usage: { percent: usagePercent, spent: budget.current_spend_usd, limit: budget.budget_limit_usd }
      };
    }

    return { 
      allowed: true, 
      message: 'Within budget', 
      usage: { percent: usagePercent, spent: budget.current_spend_usd, limit: budget.budget_limit_usd }
    };
  }

  async updateBudgetUsage(providerKeyId: number, usage: { cost_estimate_usd: number; total_tokens: number }) {
    if (!this.adminToken) await this.initialize();

    const budgetsCrud = new CrudOperations('ai_provider_budgets', this.adminToken!);
    const budgets = await budgetsCrud.findMany({ provider_key_id: providerKeyId });
    
    if (budgets.length > 0) {
      const budget = budgets[0];
      await budgetsCrud.update(budget.id, {
        current_spend_usd: budget.current_spend_usd + usage.cost_estimate_usd,
        current_tokens: budget.current_tokens + usage.total_tokens,
        current_requests: budget.current_requests + 1,
        updated_at: new Date().toISOString()
      });
    }
  }

  // Usage Analytics
  async getUsageMetrics(
    userId: number, 
    workspaceId: number, 
    timeframe: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    byProvider: Record<string, Record<string, unknown>>;
    byAlias: Record<string, Record<string, unknown>>;
    recentErrors: Array<{ provider: string; error: string; timestamp: string }>;
  }> {
    if (!this.adminToken) await this.initialize();

    const logsCrud = new CrudOperations('ai_call_logs', this.adminToken!);
    
    const startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const logs = await logsCrud.findMany(
      { user_id: userId, workspace_id: workspaceId },
      { 
        limit: 10000,
        orderBy: { column: 'created_at', direction: 'desc' }
      }
    );

    const recentLogs = logs.filter(log => 
      new Date(log.created_at) >= startDate
    );

    const totalCalls = recentLogs.length;
    const totalTokens = recentLogs.reduce((sum, log) => sum + log.total_tokens, 0);
    const totalCost = recentLogs.reduce((sum, log) => sum + log.cost_estimate_usd, 0);

    // Group by provider
    const byProvider: Record<string, Record<string, unknown>> = {};
    const byAlias: Record<string, Record<string, unknown>> = {};

    recentLogs.forEach(log => {
      // By provider
      if (!byProvider[log.provider_name]) {
        byProvider[log.provider_name] = {
          calls: 0,
          tokens: 0,
          cost: 0,
          success_rate: 0,
          avg_latency: 0
        };
      }
      (byProvider[log.provider_name].calls as number)++;
      (byProvider[log.provider_name].tokens as number) += log.total_tokens;
      (byProvider[log.provider_name].cost as number) += log.cost_estimate_usd;

      // By alias
      if (!byAlias[log.alias_name]) {
        byAlias[log.alias_name] = {
          calls: 0,
          tokens: 0,
          cost: 0,
          success_rate: 0,
          fallback_rate: 0
        };
      }
      (byAlias[log.alias_name].calls as number)++;
      (byAlias[log.alias_name].tokens as number) += log.total_tokens;
      (byAlias[log.alias_name].cost as number) += log.cost_estimate_usd;
      if (log.fallback_used) (byAlias[log.alias_name].fallback_rate as number)++;
    });

    // Calculate rates
    Object.keys(byProvider).forEach(provider => {
      const providerLogs = recentLogs.filter(log => log.provider_name === provider);
      const successful = providerLogs.filter(log => log.status === 'success').length;
      byProvider[provider].success_rate = Math.round((successful / providerLogs.length) * 100);
      byProvider[provider].avg_latency = Math.round(
        providerLogs.reduce((sum, log) => sum + log.latency_ms, 0) / providerLogs.length
      );
    });

    Object.keys(byAlias).forEach(alias => {
      const aliasLogs = recentLogs.filter(log => log.alias_name === alias);
      const successful = aliasLogs.filter(log => log.status === 'success').length;
      byAlias[alias].success_rate = Math.round((successful / aliasLogs.length) * 100);
      byAlias[alias].fallback_rate = Math.round(((byAlias[alias].fallback_rate as number) / aliasLogs.length) * 100);
    });

    // Recent errors
    const recentErrors = recentLogs
      .filter(log => log.status === 'error' && log.error_message)
      .slice(0, 10)
      .map(log => ({
        provider: log.provider_name,
        error: log.error_message!,
        timestamp: log.created_at
      }));

    return {
      totalCalls,
      totalTokens,
      totalCost,
      byProvider,
      byAlias,
      recentErrors
    };
  }

  // Default Alias Setup
  async setupDefaultAliases(userId: number, workspaceId: number): Promise<void> {
    const defaultAliases = [
      {
        alias_name: 'default-writer',
        display_name: 'Default Writer',
        modality: 'text' as const,
        capability: 'chat' as const,
        primary_provider: 'openai',
        primary_model: 'gpt-4',
        fallback_chain: [
          { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', priority: 1 },
          { provider: 'zhipu', model: 'glm-4-plus', priority: 2 }
        ],
        routing_preference: 'quality' as const,
        allow_aggregators: false,
        is_active: true
      },
      {
        alias_name: 'fast-drafts',
        display_name: 'Fast Drafts',
        modality: 'text' as const,
        capability: 'completion' as const,
        primary_provider: 'openai',
        primary_model: 'gpt-4o-mini',
        fallback_chain: [
          { provider: 'google', model: 'gemini-1.5-flash', priority: 1 }
        ],
        routing_preference: 'speed' as const,
        allow_aggregators: true,
        is_active: true
      },
      {
        alias_name: 'image-hero',
        display_name: 'Image Generator',
        modality: 'image' as const,
        capability: 'generate' as const,
        primary_provider: 'openai',
        primary_model: 'dall-e-3',
        fallback_chain: [
          { provider: 'stability', model: 'stable-diffusion-xl', priority: 1 }
        ],
        routing_preference: 'quality' as const,
        allow_aggregators: false,
        is_active: true
      }
    ];

    for (const aliasData of defaultAliases) {
      await this.createModelAlias(userId, workspaceId, aliasData);
    }
  }

  // Utility Methods
  private encryptApiKey(apiKey: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptApiKey(encryptedKey: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async verifyProviderKey(provider: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (provider) {
        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          return { valid: openaiResponse.ok, error: openaiResponse.ok ? undefined : 'Invalid OpenAI API key' };
          
        case 'anthropic':
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }]
            })
          });
          return { valid: anthropicResponse.ok, error: anthropicResponse.ok ? undefined : 'Invalid Anthropic API key' };
          
        default:
          return { valid: true }; // Skip verification for unknown providers
      }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Verification failed' };
    }
  }

  private checkScope(providerKey: AIProviderKey, modality: string): boolean {
    return providerKey.scopes[modality as keyof AIProviderKey['scopes']] || false;
  }

  private estimateCost(provider: string, model: string, tokens: number): number {
    // Simplified cost estimation - in production, use real pricing tables
    const baseCostPer1kTokens = {
      'openai': 0.002,
      'anthropic': 0.003,
      'google': 0.001,
      'mistral': 0.002,
      'groq': 0.0001,
      'zhipu': 0.001,
      'openrouter': 0.002,
      'replicate': 0.01
    };

    const cost = baseCostPer1kTokens[provider as keyof typeof baseCostPer1kTokens] || 0.002;
    return (tokens / 1000) * cost;
  }

  private getProviderTier(provider: string): number {
    const tier1Providers = ['openai', 'anthropic', 'google', 'mistral', 'groq', 'zhipu'];
    return tier1Providers.includes(provider) ? 1 : 2;
  }

  private async getAliasByName(workspaceId: number, aliasName: string): Promise<ModelAlias | null> {
    if (!this.adminToken) await this.initialize();

    const aliasesCrud = new CrudOperations('ai_model_aliases', this.adminToken!);
    const aliases = await aliasesCrud.findMany({ 
      workspace_id: workspaceId, 
      alias_name: aliasName,
      is_active: true 
    });
    
    return aliases[0] || null;
  }

  private async getProviderKeyForWorkspace(workspaceId: number, provider: string): Promise<AIProviderKey | null> {
    if (!this.adminToken) await this.initialize();

    const keysCrud = new CrudOperations('ai_provider_keys', this.adminToken!);
    const keys = await keysCrud.findMany({ 
      workspace_id: workspaceId, 
      provider_name: provider,
      status: 'active'
    });
    
    return keys[0] || null;
  }

  private async logAICall(logData: Omit<AICallLog, 'id' | 'created_at'>): Promise<void> {
    if (!this.adminToken) await this.initialize();

    const logsCrud = new CrudOperations('ai_call_logs', this.adminToken!);
    await logsCrud.create({
      ...logData,
      created_at: new Date().toISOString()
    });
  }

  // Provider Catalog with proper typing
  getAvailableProviders(): Record<string, AIProvider> {
    return {
      openai: {
        name: 'openai',
        display_name: 'OpenAI',
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text', 'image'],
        models: {
          'gpt-4': 'GPT-4 (Latest)',
          'gpt-4-turbo': 'GPT-4 Turbo',
          'gpt-4o': 'GPT-4o',
          'gpt-4o-mini': 'GPT-4o Mini',
          'dall-e-3': 'DALL·E 3'
        },
        features: ['chat', 'completion', 'embedding', 'image_generation']
      },
      anthropic: {
        name: 'anthropic',
        display_name: 'Anthropic',
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        models: {
          'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
          'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
          'claude-3-opus-20240229': 'Claude 3 Opus'
        },
        features: ['chat', 'completion']
      },
      google: {
        name: 'google',
        display_name: 'Google',
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text', 'image'],
        models: {
          'gemini-1.5-pro': 'Gemini 1.5 Pro',
          'gemini-1.5-flash': 'Gemini 1.5 Flash',
          'gemini-2.0-flash-exp': 'Gemini 2.0 Flash (Experimental)'
        },
        features: ['chat', 'completion', 'embedding', 'image_analysis']
      },
      mistral: {
        name: 'mistral',
        display_name: 'Mistral AI',
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        models: {
          'mistral-large-latest': 'Mistral Large',
          'mistral-medium-latest': 'Mistral Medium',
          'mistral-small-latest': 'Mistral Small'
        },
        features: ['chat', 'completion']
      },
      groq: {
        name: 'groq',
        display_name: 'Groq',
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        models: {
          'llama-3.1-70b-versatile': 'Llama 3.1 70B',
          'llama-3.1-8b-instant': 'Llama 3.1 8B (Ultra-fast)',
          'mixtral-8x7b-32768': 'Mixtral 8x7B'
        },
        features: ['chat', 'completion']
      },
      zhipu: {
        name: 'zhipu',
        display_name: 'Zhipu AI',
        tier: 1,
        is_aggregator: false,
        supported_modalities: ['text'],
        models: {
          'glm-4-plus': 'GLM-4 Plus',
          'glm-4-0520': 'GLM-4',
          'glm-4-air': 'GLM-4 Air'
        },
        features: ['chat', 'completion']
      },
      openrouter: {
        name: 'openrouter',
        display_name: 'OpenRouter',
        tier: 2,
        is_aggregator: true,
        supported_modalities: ['text'],
        models: {
          'openai/gpt-4': 'GPT-4 (via OpenRouter)',
          'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet (via OpenRouter)',
          'meta-llama/llama-3.1-70b-instruct': 'Llama 3.1 70B (via OpenRouter)'
        },
        features: ['chat', 'completion']
      },
      replicate: {
        name: 'replicate',
        display_name: 'Replicate',
        tier: 2,
        is_aggregator: true,
        supported_modalities: ['image', 'video'],
        models: {
          'stability-ai/sdxl': 'Stable Diffusion XL',
          'meta/llama-2-70b-chat': 'Llama 2 70B Chat',
          'runwayml/stable-video-diffusion': 'Stable Video Diffusion'
        },
        features: ['image_generation', 'video_generation']
      }
    };
  }

  // Helper method to get properly typed models for a provider
  getProviderModels(providerName: string): ProviderModel[] {
    const providers = this.getAvailableProviders();
    const provider = providers[providerName];
    
    if (!provider || !provider.models) {
      return [];
    }
    
    return Object.entries(provider.models).map(([key, name]) => ({
      key,
      name: String(name), // Ensure name is always a string
      description: `${provider.display_name} model`,
      capabilities: provider.features
    }));
  }
}

// Global AI provider system instance
let aiProviderSystem: AIProviderSystem | null = null;

export async function getAIProviderSystem(): Promise<AIProviderSystem> {
  if (!aiProviderSystem) {
    aiProviderSystem = new AIProviderSystem();
    await aiProviderSystem.initialize();
  }
  return aiProviderSystem;
}

// Export types for use in components
export type { AIProvider, ProviderModel, AIProviderKey, ModelAlias, AIRequest, AIResponse, AICallLog };
