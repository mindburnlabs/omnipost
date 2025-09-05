-- Complete OmniPost Database Schema for Supabase (public schema)
-- This creates all required tables with proper RLS policies

-- User profiles extension table
CREATE TABLE public.user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "schedule_reminders": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform connections table
CREATE TABLE public.platform_connections (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_type VARCHAR(20) NOT NULL CHECK (platform_type IN ('discord', 'telegram', 'whop')),
    connection_name VARCHAR(100) NOT NULL,
    api_credentials JSONB NOT NULL,
    connection_status VARCHAR(20) DEFAULT 'active' CHECK (connection_status IN ('active', 'inactive', 'error', 'expired')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform_type, connection_name)
);

-- Content posts table
CREATE TABLE public.posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'link', 'mixed')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'archived')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Post platform assignments table
CREATE TABLE public.post_platforms (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    platform_connection_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    platform_specific_content JSONB,
    publish_status VARCHAR(20) DEFAULT 'pending' CHECK (publish_status IN ('pending', 'published', 'failed', 'skipped')),
    platform_post_id VARCHAR(255),
    error_message TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, platform_connection_id)
);

-- Content assets table (images, videos, files)
CREATE TABLE public.content_assets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content templates table
CREATE TABLE public.content_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_content TEXT NOT NULL,
    template_type VARCHAR(20) DEFAULT 'general' CHECK (template_type IN ('general', 'announcement', 'promotion', 'update', 'question')),
    platform_specific JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content snippets table (reusable text blocks)
CREATE TABLE public.content_snippets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    usage_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduling conflicts table
CREATE TABLE public.scheduling_conflicts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    conflicting_post_id BIGINT NOT NULL,
    conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('time_overlap', 'platform_limit', 'content_similarity')),
    conflict_severity VARCHAR(10) DEFAULT 'medium' CHECK (conflict_severity IN ('low', 'medium', 'high')),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Best posting times recommendations table
CREATE TABLE public.posting_time_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_type VARCHAR(20) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
    engagement_score DECIMAL(5,2) DEFAULT 0,
    recommendation_strength VARCHAR(10) DEFAULT 'medium' CHECK (recommendation_strength IN ('low', 'medium', 'high')),
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform_type, day_of_week, hour_of_day)
);

-- Analytics metrics table
CREATE TABLE public.analytics_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT,
    platform_connection_id BIGINT,
    metric_type VARCHAR(30) NOT NULL CHECK (metric_type IN ('views', 'likes', 'shares', 'comments', 'clicks', 'reach', 'impressions')),
    metric_value BIGINT DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User activity log table
CREATE TABLE public.user_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    activity_type VARCHAR(30) NOT NULL,
    activity_description TEXT NOT NULL,
    related_entity_type VARCHAR(20),
    related_entity_id BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content validation results table
CREATE TABLE public.content_validations (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    validation_type VARCHAR(30) NOT NULL CHECK (validation_type IN ('link_check', 'image_size', 'character_count', 'platform_compliance', 'spam_check')),
    validation_status VARCHAR(10) NOT NULL CHECK (validation_status IN ('passed', 'failed', 'warning')),
    validation_message TEXT,
    validation_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces table for multi-tenant support
CREATE TABLE public.workspaces (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_demo BOOLEAN DEFAULT false,
    whop_experience_id VARCHAR(100),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Post approvals table
CREATE TABLE public.post_approvals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    approver_user_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- A/B experiments table
CREATE TABLE public.ab_experiments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
    winner_variant_id BIGINT,
    confidence_level NUMERIC(5,2) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- A/B experiment variants table
CREATE TABLE public.ab_experiment_variants (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    experiment_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    traffic_percentage INTEGER DEFAULT 50,
    performance_score NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automation rules table
CREATE TABLE public.automation_rules (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(30) NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    actions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Brand kit table
CREATE TABLE public.brand_kits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    primary_color VARCHAR(7) DEFAULT '#2563eb',
    secondary_color VARCHAR(7) DEFAULT '#64748b',
    logo_url TEXT,
    fonts JSONB DEFAULT '{}',
    tone_guidelines TEXT,
    banned_words TEXT[],
    utm_templates JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI providers reference table (system-wide, no RLS needed)
CREATE TABLE public.ai_providers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    api_base_url TEXT,
    supported_features JSONB DEFAULT '{}',
    default_models JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User AI provider configurations
CREATE TABLE public.user_ai_configurations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    api_key TEXT NOT NULL,
    selected_models JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_validated_at TIMESTAMP WITH TIME ZONE,
    validation_status VARCHAR(20) DEFAULT 'pending',
    validation_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_ai_configurations_validation_status_check 
        CHECK (validation_status IN ('pending', 'valid', 'invalid', 'expired'))
);

-- AI usage tracking
CREATE TABLE public.ai_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    usage_type VARCHAR(30) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_estimate NUMERIC(10,6) DEFAULT 0,
    request_duration_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_usage_logs_usage_type_check 
        CHECK (usage_type IN ('text_generation', 'image_analysis', 'content_optimization', 'translation')),
    CONSTRAINT ai_usage_logs_status_check 
        CHECK (status IN ('success', 'error', 'timeout', 'rate_limited'))
);

-- AI generated content history
CREATE TABLE public.ai_generated_content (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    content_type VARCHAR(30) NOT NULL,
    input_prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    quality_score NUMERIC(3,2),
    user_rating INTEGER,
    is_used BOOLEAN DEFAULT false,
    related_post_id BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_generated_content_content_type_check 
        CHECK (content_type IN ('post_content', 'caption', 'hashtags', 'title', 'description')),
    CONSTRAINT ai_generated_content_user_rating_check 
        CHECK (user_rating >= 1 AND user_rating <= 5)
);
