
# AI Provider System Documentation

## Overview

The AI Provider System implements a comprehensive BYOK (Bring Your Own Key) vault with alias-based routing, automatic fallbacks, budget controls, and observability for OmniPost's AI features.

## Key Features

### 1. Provider-Agnostic Control
- Workspaces choose which models/providers to use for each capability
- Alias-based routing abstracts provider details from application features
- Automatic failover between providers based on availability and budgets

### 2. Security & Privacy
- API keys never touch the browser - all calls are server-side
- Envelope encryption with workspace-scoped data keys
- Masked logs with no API key exposure
- Optional zero-retention mode for sensitive workspaces

### 3. Modality Coverage
- **Text**: Chat, completion, embedding
- **Image**: Generation, editing, variation
- **Audio**: Speech-to-text (STT), text-to-speech (TTS)
- **Video**: Generation, editing, captioning

### 4. Budget & Limits
- Per-workspace budgets (tokens/$/requests)
- Soft warnings at 80% usage
- Hard stops at 100% usage
- Real-time usage tracking and cost estimation

### 5. Observability
- Per-call metering with latency, cost, and provider-of-record
- Success/failure tracking with detailed error reasons
- Fallback usage analytics
- Export capabilities for billing and analysis

## Architecture

### Database Schema

#### ai_providers
Catalog of available AI providers with capabilities and pricing models.

#### ai_provider_keys
Encrypted storage of user API keys with scopes and budgets.

#### ai_model_aliases
User-friendly aliases that map to provider chains with fallback routing.

#### ai_call_logs
Comprehensive logging of all AI requests with metrics and outcomes.

#### ai_provider_budgets
Budget tracking and limits per provider key.

### Core Components

#### AIProviderSystem (`src/lib/ai-provider-system.ts`)
Main orchestration class handling:
- Key management and encryption
- Alias resolution and routing
- Provider adapters and fallback logic
- Usage tracking and budget enforcement

#### Provider Adapters
Individual adapters for each AI provider:
- OpenAI (GPT-4, DALL-E)
- Anthropic (Claude)
- Google (Gemini)
- Mistral AI
- Groq (Llama)
- Zhipu (GLM)
- OpenRouter (Aggregator)
- Replicate (OSS models)

## API Endpoints

### AI Keys Management
- `GET /ai-keys` - List user's API keys (masked)
- `POST /ai-keys` - Add new API key with verification
- `PUT /ai-keys/[id]` - Update key settings
- `DELETE /ai-keys/[id]` - Revoke API key
- `POST /ai-keys/[id]/verify` - Re-verify API key

### Model Aliases
- `GET /ai-aliases` - List user's model aliases
- `POST /ai-aliases` - Create new alias
- `PUT /ai-aliases/[id]` - Update alias configuration
- `DELETE /ai-aliases/[id]` - Deactivate alias

### AI Invocation
- `POST /ai-invoke` - Invoke AI via alias with automatic routing

### Usage Analytics
- `GET /ai-usage` - Get usage metrics and analytics
- `GET /ai-providers` - Get available providers catalog

## Default Aliases

The system creates these default aliases for new workspaces:

### Text Aliases
- **default-writer**: OpenAI GPT-4 → Anthropic Claude → Zhipu GLM-4
- **fast-drafts**: OpenAI GPT-4o-mini → Gemini Flash
- **code-assist**: OpenAI GPT-4 → Groq Llama 3.1

### Image Aliases
- **image-hero**: OpenAI DALL-E 3 → Stability SDXL

### Audio Aliases (Future)
- **stt-transcribe**: Deepgram → Whisper
- **tts-voice**: ElevenLabs

### Video Aliases (Future)
- **video-synth**: Google Veo → KlingAI → Runway

## Usage Examples

### Basic AI Invocation
```typescript
const response = await api.post('/ai-invoke', {
  alias_name: 'default-writer',
  capability: 'chat',
  prompt: 'Improve this social media post: "Hello world"',
  options: {
    temperature: 0.7,
    max_tokens: 1000
  },
  workspace_id: 1
});
```

### Adding API Key
```typescript
const key = await api.post('/ai-keys', {
  provider: 'openai',
  label: 'Main OpenAI Key',
  api_key: 'sk-...',
  scopes: {
    text: true,
    image: true,
    audio: false,
    video: false
  },
  monthly_budget_usd: 100,
  workspace_id: 1
});
```

### Creating Custom Alias
```typescript
const alias = await api.post('/ai-aliases', {
  alias_name: 'creative-writer',
  display_name: 'Creative Writer',
  modality: 'text',
  capability: 'chat',
  primary_provider: 'anthropic',
  primary_model: 'claude-3-5-sonnet-20241022',
  fallback_chain: [
    { provider: 'openai', model: 'gpt-4', priority: 1 },
    { provider: 'mistral', model: 'mistral-large-latest', priority: 2 }
  ],
  routing_preference: 'quality',
  allow_aggregators: false,
  workspace_id: 1
});
```

## Error Handling

The system provides human-readable error messages:

- **Missing key**: "Add a key for this alias in Settings → AI Keys."
- **Budget reached**: "Budget reached. Increase cap or switch to platform credits."
- **Provider error**: "This provider is unavailable; routed to fallback."
- **Unsupported scope**: "This key doesn't allow video. Enable 'video' scope or pick another alias."

## Routing Policy

### Failover Rules
1. On timeout/rate-limit/provider error → advance to next in chain
2. On budget exhaust → advance to next if permitted
3. Record provider-of-record and fallback reason
4. Respect aggregator toggle per alias

### Routing Preferences
- **Quality**: Prefer highest-quality models (default)
- **Speed**: Prefer lowest latency providers
- **Cost**: Prefer most cost-effective options

## Compliance & Governance

### Data Protection
- Envelope encryption for API keys
- Workspace-scoped data keys
- Optional zero-retention mode
- Audit trail for all AI calls

### Budget Controls
- Per-key monthly limits ($/tokens/requests)
- Real-time usage tracking
- Automatic warnings and stops
- Usage export for billing

### Access Controls
- Scope-based permissions per key
- Workspace isolation
- Role-based access to AI features
- Admin-only provider catalog management

## Monitoring & Observability

### Metrics Tracked
- Request count and success rate
- Token usage and cost estimation
- Latency and performance metrics
- Fallback usage patterns
- Error rates and types

### Dashboards
- Usage by provider and alias
- Budget utilization
- Error analysis
- Performance trends

## Rollout Plan

### MVP (Current)
- Text modalities (chat, completion)
- Core providers (OpenAI, Anthropic, Google, Mistral, Groq, Zhipu)
- BYOK vault with encryption
- Basic aliases and fallbacks
- Usage tracking and budgets

### Closed Beta
- Image generation (DALL-E, SDXL)
- Audio capabilities (STT/TTS)
- Video generation (Veo, Runway, Pika)
- Advanced routing preferences
- Aggregator support

### Release 1.0
- Enterprise features (SSO/SCIM)
- Data residency controls
- Advanced DLP rules
- Public API access
- SIEM export capabilities

## Configuration

### Environment Variables
```bash
AI_ENCRYPTION_KEY=your-encryption-key-here
OPENAI_API_KEY=sk-... # System default (optional)
ANTHROPIC_API_KEY=sk-ant-... # System default (optional)
GOOGLE_AI_API_KEY=AIza... # System default (optional)
```

### Database Migrations
Run the provided SQL migrations to create the required tables:
- ai_providers
- ai_provider_keys  
- ai_model_aliases
- ai_call_logs
- ai_provider_budgets

## Testing

### Golden Path Tests
1. Add API key → verify → create alias → invoke AI → success
2. Budget exhaust → fallback to next provider → success
3. Provider failure → automatic failover → success with logging
4. Invalid key → clear error message → user can fix

### Security Tests
1. API keys never appear in client responses
2. Logs are properly masked
3. Encryption/decryption works correctly
4. Workspace isolation is enforced

## Support

For issues with the AI Provider System:
1. Check Settings → AI Configuration → Usage & Health
2. Review recent errors in the dashboard
3. Verify API keys are active and within budget
4. Check alias configuration and fallback chains

## Future Enhancements

- Real-time streaming responses
- Custom model fine-tuning integration
- Advanced prompt templates
- Multi-modal request chaining
- Cost optimization recommendations
- Provider performance benchmarking
