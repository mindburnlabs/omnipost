
// AI Provider System Types
export interface ProviderModel {
  key: string;
  name: string; // Must be a string for SelectItem label
  description?: string;
  capabilities?: string[];
  pricing?: {
    input?: number;
    output?: number;
    unit?: string;
  };
}

export interface AIProvider {
  name: string;
  display_name: string;
  description?: string;
  tier: number;
  is_aggregator: boolean;
  supported_modalities: string[];
  models: Record<string, string>;
  features: string[];
  api_base_url?: string;
  pricing_model?: Record<string, unknown>;
  rate_limits?: Record<string, unknown>;
  data_residency?: string;
}

export interface AIProviderKey {
  id: number;
  user_id: number;
  workspace_id: number;
  provider_name: string;
  key_label: string;
  encrypted_api_key: string;
  key_last_four: string;
  scopes: {
    text: boolean;
    image: boolean;
    audio: boolean;
    video: boolean;
  };
  status: 'active' | 'inactive' | 'expired' | 'invalid' | 'rotating';
  last_verified_at?: string;
  verification_error?: string;
  monthly_budget_usd: number;
  monthly_token_limit: number;
  monthly_request_limit: number;
  rate_limit_per_minute: number;
  data_residency: 'us' | 'eu' | 'global';
  zero_retention_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelAlias {
  id: number;
  user_id: number;
  workspace_id: number;
  alias_name: string;
  display_name: string;
  modality: 'text' | 'image' | 'audio' | 'video';
  capability: 'chat' | 'completion' | 'embedding' | 'generate' | 'edit' | 'variation' | 'stt' | 'tts' | 'caption';
  primary_provider: string;
  primary_model: string;
  fallback_chain: Array<{
    provider: string;
    model: string;
    priority: number;
  }>;
  routing_preference: 'quality' | 'speed' | 'cost';
  allow_aggregators: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIRequest {
  workspace_id: number;
  user_id: number;
  alias_name: string;
  capability: string;
  prompt?: string;
  input_data?: Record<string, unknown>;
  options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  };
}

export interface AIResponse {
  success: boolean;
  content?: string;
  data?: Record<string, unknown>;
  provider_used: string;
  model_used: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_estimate_usd: number;
  };
  latency_ms: number;
  fallback_used: boolean;
  fallback_reason?: string;
  error?: string;
  request_id: string;
}

export interface AICallLog {
  id: number;
  user_id: number;
  workspace_id: number;
  alias_name: string;
  provider_name: string;
  model_name: string;
  modality: string;
  capability: string;
  request_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_characters: number;
  output_characters: number;
  media_seconds: number;
  media_frames: number;
  cost_estimate_usd: number;
  latency_ms: number;
  status: 'success' | 'error' | 'timeout' | 'rate_limited' | 'budget_exceeded' | 'fallback_used';
  error_code?: string;
  error_message?: string;
  fallback_used: boolean;
  fallback_reason?: string;
  provider_of_record: string;
  request_metadata: Record<string, unknown>;
  response_metadata: Record<string, unknown>;
  created_at: string;
}
