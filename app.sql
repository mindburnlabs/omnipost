
-- User profiles extension table
CREATE TABLE user_profiles (
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
CREATE TABLE platform_connections (
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
CREATE TABLE posts (
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
CREATE TABLE post_platforms (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    platform_connection_id BIGINT NOT NULL,
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
CREATE TABLE content_assets (
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
CREATE TABLE content_templates (
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
CREATE TABLE content_snippets (
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
CREATE TABLE scheduling_conflicts (
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
CREATE TABLE posting_time_recommendations (
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
CREATE TABLE analytics_metrics (
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
CREATE TABLE user_activities (
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
CREATE TABLE content_validations (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    validation_type VARCHAR(30) NOT NULL CHECK (validation_type IN ('link_check', 'image_size', 'character_count', 'platform_compliance', 'spam_check')),
    validation_status VARCHAR(10) NOT NULL CHECK (validation_status IN ('passed', 'failed', 'warning')),
    validation_message TEXT,
    validation_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for all user-related tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_time_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_validations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY user_profiles_select_policy ON user_profiles
    FOR SELECT USING (user_id = uid());
CREATE POLICY user_profiles_insert_policy ON user_profiles
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY user_profiles_update_policy ON user_profiles
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY user_profiles_delete_policy ON user_profiles
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for platform_connections
CREATE POLICY platform_connections_select_policy ON platform_connections
    FOR SELECT USING (user_id = uid());
CREATE POLICY platform_connections_insert_policy ON platform_connections
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY platform_connections_update_policy ON platform_connections
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY platform_connections_delete_policy ON platform_connections
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for posts
CREATE POLICY posts_select_policy ON posts
    FOR SELECT USING (user_id = uid());
CREATE POLICY posts_insert_policy ON posts
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY posts_update_policy ON posts
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY posts_delete_policy ON posts
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for post_platforms
CREATE POLICY post_platforms_select_policy ON post_platforms
    FOR SELECT USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_platforms.post_id AND posts.user_id = uid()));
CREATE POLICY post_platforms_insert_policy ON post_platforms
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_platforms.post_id AND posts.user_id = uid()));
CREATE POLICY post_platforms_update_policy ON post_platforms
    FOR UPDATE USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_platforms.post_id AND posts.user_id = uid()));
CREATE POLICY post_platforms_delete_policy ON post_platforms
    FOR DELETE USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_platforms.post_id AND posts.user_id = uid()));

-- Create RLS policies for content_assets
CREATE POLICY content_assets_select_policy ON content_assets
    FOR SELECT USING (user_id = uid());
CREATE POLICY content_assets_insert_policy ON content_assets
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY content_assets_update_policy ON content_assets
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY content_assets_delete_policy ON content_assets
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for content_templates
CREATE POLICY content_templates_select_policy ON content_templates
    FOR SELECT USING (user_id = uid());
CREATE POLICY content_templates_insert_policy ON content_templates
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY content_templates_update_policy ON content_templates
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY content_templates_delete_policy ON content_templates
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for content_snippets
CREATE POLICY content_snippets_select_policy ON content_snippets
    FOR SELECT USING (user_id = uid());
CREATE POLICY content_snippets_insert_policy ON content_snippets
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY content_snippets_update_policy ON content_snippets
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY content_snippets_delete_policy ON content_snippets
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for scheduling_conflicts
CREATE POLICY scheduling_conflicts_select_policy ON scheduling_conflicts
    FOR SELECT USING (user_id = uid());
CREATE POLICY scheduling_conflicts_insert_policy ON scheduling_conflicts
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY scheduling_conflicts_update_policy ON scheduling_conflicts
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY scheduling_conflicts_delete_policy ON scheduling_conflicts
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for posting_time_recommendations
CREATE POLICY posting_time_recommendations_select_policy ON posting_time_recommendations
    FOR SELECT USING (user_id = uid());
CREATE POLICY posting_time_recommendations_insert_policy ON posting_time_recommendations
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY posting_time_recommendations_update_policy ON posting_time_recommendations
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY posting_time_recommendations_delete_policy ON posting_time_recommendations
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for analytics_metrics
CREATE POLICY analytics_metrics_select_policy ON analytics_metrics
    FOR SELECT USING (user_id = uid());
CREATE POLICY analytics_metrics_insert_policy ON analytics_metrics
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY analytics_metrics_update_policy ON analytics_metrics
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY analytics_metrics_delete_policy ON analytics_metrics
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for user_activities
CREATE POLICY user_activities_select_policy ON user_activities
    FOR SELECT USING (user_id = uid());
CREATE POLICY user_activities_insert_policy ON user_activities
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY user_activities_update_policy ON user_activities
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY user_activities_delete_policy ON user_activities
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for content_validations
CREATE POLICY content_validations_select_policy ON content_validations
    FOR SELECT USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = content_validations.post_id AND posts.user_id = uid()));
CREATE POLICY content_validations_insert_policy ON content_validations
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = content_validations.post_id AND posts.user_id = uid()));
CREATE POLICY content_validations_update_policy ON content_validations
    FOR UPDATE USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = content_validations.post_id AND posts.user_id = uid()));
CREATE POLICY content_validations_delete_policy ON content_validations
    FOR DELETE USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = content_validations.post_id AND posts.user_id = uid()));

-- Create indexes for performance optimization
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX idx_platform_connections_status ON platform_connections(connection_status);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_post_platforms_post_id ON post_platforms(post_id);
CREATE INDEX idx_post_platforms_platform_connection_id ON post_platforms(platform_connection_id);
CREATE INDEX idx_content_assets_user_id ON content_assets(user_id);
CREATE INDEX idx_content_assets_file_type ON content_assets(file_type);
CREATE INDEX idx_content_templates_user_id ON content_templates(user_id);
CREATE INDEX idx_content_snippets_user_id ON content_snippets(user_id);
CREATE INDEX idx_scheduling_conflicts_user_id ON scheduling_conflicts(user_id);
CREATE INDEX idx_scheduling_conflicts_post_id ON scheduling_conflicts(post_id);
CREATE INDEX idx_posting_time_recommendations_user_id ON posting_time_recommendations(user_id);
CREATE INDEX idx_analytics_metrics_user_id ON analytics_metrics(user_id);
CREATE INDEX idx_analytics_metrics_post_id ON analytics_metrics(post_id);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_content_validations_post_id ON content_validations(post_id);

-- Create admin default profile
INSERT INTO user_profiles (user_id) VALUES (1);

-- Add user_id field to content_validations table for better performance
ALTER TABLE content_validations ADD COLUMN user_id BIGINT NOT NULL DEFAULT 1;

-- Add user_id field to post_platforms table for better performance  
ALTER TABLE post_platforms ADD COLUMN user_id BIGINT NOT NULL DEFAULT 1;

-- Create indexes for the new user_id fields
CREATE INDEX idx_content_validations_user_id ON content_validations(user_id);
CREATE INDEX idx_post_platforms_user_id ON post_platforms(user_id);

-- Drop the existing complex RLS policies that are causing performance issues
DROP POLICY content_validations_select_policy ON content_validations;
DROP POLICY content_validations_insert_policy ON content_validations;
DROP POLICY content_validations_update_policy ON content_validations;
DROP POLICY content_validations_delete_policy ON content_validations;

DROP POLICY post_platforms_select_policy ON post_platforms;
DROP POLICY post_platforms_insert_policy ON post_platforms;
DROP POLICY post_platforms_update_policy ON post_platforms;
DROP POLICY post_platforms_delete_policy ON post_platforms;

-- Create simple, fast RLS policies using direct user_id checks
CREATE POLICY content_validations_select_policy ON content_validations
    FOR SELECT USING (user_id = uid());

CREATE POLICY content_validations_insert_policy ON content_validations
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY content_validations_update_policy ON content_validations
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY content_validations_delete_policy ON content_validations
    FOR DELETE USING (user_id = uid());

CREATE POLICY post_platforms_select_policy ON post_platforms
    FOR SELECT USING (user_id = uid());

CREATE POLICY post_platforms_insert_policy ON post_platforms
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY post_platforms_update_policy ON post_platforms
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY post_platforms_delete_policy ON post_platforms
    FOR DELETE USING (user_id = uid());

-- Fix the analytics_metrics update policy to include WITH CHECK
DROP POLICY analytics_metrics_update_policy ON analytics_metrics;
CREATE POLICY analytics_metrics_update_policy ON analytics_metrics
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

-- Add missing tables for complete OmniPost functionality

-- Workspaces table for multi-tenant support
CREATE TABLE workspaces (
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
CREATE TABLE post_approvals (
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
CREATE TABLE ab_experiments (
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
CREATE TABLE ab_experiment_variants (
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
CREATE TABLE automation_rules (
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
CREATE TABLE brand_kits (
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

-- Create indexes for performance
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_post_approvals_user_id ON post_approvals(user_id);
CREATE INDEX idx_post_approvals_post_id ON post_approvals(post_id);
CREATE INDEX idx_ab_experiments_user_id ON ab_experiments(user_id);
CREATE INDEX idx_ab_experiment_variants_user_id ON ab_experiment_variants(user_id);
CREATE INDEX idx_ab_experiment_variants_experiment_id ON ab_experiment_variants(experiment_id);
CREATE INDEX idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX idx_brand_kits_user_id ON brand_kits(user_id);

-- Enable RLS on new tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for new tables
CREATE POLICY workspaces_select_policy ON workspaces FOR SELECT USING (user_id = uid());
CREATE POLICY workspaces_insert_policy ON workspaces FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY workspaces_update_policy ON workspaces FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY workspaces_delete_policy ON workspaces FOR DELETE USING (user_id = uid());

CREATE POLICY post_approvals_select_policy ON post_approvals FOR SELECT USING (user_id = uid());
CREATE POLICY post_approvals_insert_policy ON post_approvals FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY post_approvals_update_policy ON post_approvals FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY post_approvals_delete_policy ON post_approvals FOR DELETE USING (user_id = uid());

CREATE POLICY ab_experiments_select_policy ON ab_experiments FOR SELECT USING (user_id = uid());
CREATE POLICY ab_experiments_insert_policy ON ab_experiments FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY ab_experiments_update_policy ON ab_experiments FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ab_experiments_delete_policy ON ab_experiments FOR DELETE USING (user_id = uid());

CREATE POLICY ab_experiment_variants_select_policy ON ab_experiment_variants FOR SELECT USING (user_id = uid());
CREATE POLICY ab_experiment_variants_insert_policy ON ab_experiment_variants FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY ab_experiment_variants_update_policy ON ab_experiment_variants FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ab_experiment_variants_delete_policy ON ab_experiment_variants FOR DELETE USING (user_id = uid());

CREATE POLICY automation_rules_select_policy ON automation_rules FOR SELECT USING (user_id = uid());
CREATE POLICY automation_rules_insert_policy ON automation_rules FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY automation_rules_update_policy ON automation_rules FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY automation_rules_delete_policy ON automation_rules FOR DELETE USING (user_id = uid());

CREATE POLICY brand_kits_select_policy ON brand_kits FOR SELECT USING (user_id = uid());
CREATE POLICY brand_kits_insert_policy ON brand_kits FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY brand_kits_update_policy ON brand_kits FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY brand_kits_delete_policy ON brand_kits FOR DELETE USING (user_id = uid());

-- Create demo workspace and admin profile
INSERT INTO workspaces (user_id, name, slug, description, is_demo, whop_experience_id) 
VALUES (1, 'Demo Workspace', 'demo', 'Demo workspace with sample content', true, 'exp_demo');

INSERT INTO user_profiles (user_id, display_name, timezone) VALUES (1, 'Admin User', 'UTC');
INSERT INTO brand_kits (user_id, name, tone_guidelines) VALUES (1, 'Default Brand Kit', 'Professional and friendly tone');

-- Create the uid() function that RLS policies depend on
CREATE OR REPLACE FUNCTION uid() RETURNS BIGINT AS $$
BEGIN
  -- Extract user ID from JWT token in current_setting
  -- This will be set by the application middleware
  RETURN COALESCE(
    NULLIF(current_setting('app.current_user_id', true), '')::BIGINT,
    NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id BIGINT) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user and profile for testing
INSERT INTO users (id, email, password, role) 
VALUES (1, 'admin@omnipost.app', '$2b$10$rQZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9Q', 'app20250904195901yvsuhcayno_v1_admin_user')
ON CONFLICT (id) DO NOTHING;

-- Create default profile for admin user
INSERT INTO user_profiles (user_id, display_name, timezone) 
VALUES (1, 'Admin User', 'UTC')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions to the uid function
GRANT EXECUTE ON FUNCTION uid() TO app20250904195901yvsuhcayno_v1_user;
GRANT EXECUTE ON FUNCTION uid() TO app20250904195901yvsuhcayno_v1_admin_user;
GRANT EXECUTE ON FUNCTION set_current_user_id(BIGINT) TO app20250904195901yvsuhcayno_v1_user;
GRANT EXECUTE ON FUNCTION set_current_user_id(BIGINT) TO app20250904195901yvsuhcayno_v1_admin_user;

-- AI providers reference table (system-wide, no RLS needed)
CREATE TABLE ai_providers (
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
CREATE TABLE user_ai_configurations (
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
CREATE TABLE ai_usage_logs (
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
CREATE TABLE ai_generated_content (
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

-- Enable RLS for user-specific tables
ALTER TABLE user_ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_ai_configurations
CREATE POLICY user_ai_configurations_select_policy ON user_ai_configurations
    FOR SELECT USING (user_id = uid());

CREATE POLICY user_ai_configurations_insert_policy ON user_ai_configurations
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY user_ai_configurations_update_policy ON user_ai_configurations
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY user_ai_configurations_delete_policy ON user_ai_configurations
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for ai_usage_logs
CREATE POLICY ai_usage_logs_select_policy ON ai_usage_logs
    FOR SELECT USING (user_id = uid());

CREATE POLICY ai_usage_logs_insert_policy ON ai_usage_logs
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY ai_usage_logs_update_policy ON ai_usage_logs
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY ai_usage_logs_delete_policy ON ai_usage_logs
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for ai_generated_content
CREATE POLICY ai_generated_content_select_policy ON ai_generated_content
    FOR SELECT USING (user_id = uid());

CREATE POLICY ai_generated_content_insert_policy ON ai_generated_content
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY ai_generated_content_update_policy ON ai_generated_content
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY ai_generated_content_delete_policy ON ai_generated_content
    FOR DELETE USING (user_id = uid());

-- Create indexes for performance
CREATE INDEX idx_user_ai_configurations_user_id ON user_ai_configurations(user_id);
CREATE INDEX idx_user_ai_configurations_provider ON user_ai_configurations(provider_name);
CREATE INDEX idx_user_ai_configurations_default ON user_ai_configurations(user_id, is_default) WHERE is_default = true;

CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider_name);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

CREATE INDEX idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX idx_ai_generated_content_provider ON ai_generated_content(provider_name);
CREATE INDEX idx_ai_generated_content_post_id ON ai_generated_content(related_post_id);

-- Insert supported AI providers (system data, no RLS restrictions)
INSERT INTO ai_providers (name, display_name, description, api_base_url, supported_features, default_models, sort_order) VALUES
('gemini', 'Google Gemini', 'Google''s advanced AI model with text and image capabilities', 'https://generativelanguage.googleapis.com', 
 '{"text_generation": true, "image_analysis": true, "multimodal": true}', 
 '{"text": "gemini-2.5-pro", "image": "gemini-2.5-flash-image-preview"}', 1),
('openrouter', 'OpenRouter', 'Access to multiple AI models through OpenRouter API', 'https://openrouter.ai/api/v1', 
 '{"text_generation": true, "multiple_models": true}', 
 '{"text": "deepseek/deepseek-chat-v3.1:free", "alternative": "z-ai/glm-4.5-air:free"}', 2);

-- Create default AI configuration for admin user (user_id = 1)
INSERT INTO user_ai_configurations (user_id, provider_name, api_key, selected_models, is_default, is_active, validation_status) VALUES 
(1, 'gemini', 'system_default', '{"text": "gemini-2.5-pro", "image": "gemini-2.5-flash-image-preview"}', true, true, 'valid');

-- AI Provider Keys - Encrypted BYOK vault per workspace
CREATE TABLE ai_provider_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    key_label VARCHAR(100) NOT NULL,
    encrypted_api_key TEXT NOT NULL,
    key_last_four VARCHAR(4) NOT NULL,
    scopes JSONB DEFAULT '{"text": true, "image": false, "audio": false, "video": false}'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'invalid', 'rotating')),
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verification_error TEXT,
    monthly_budget_usd NUMERIC(10,2) DEFAULT 0,
    monthly_token_limit BIGINT DEFAULT 0,
    monthly_request_limit INTEGER DEFAULT 0,
    rate_limit_per_minute INTEGER DEFAULT 0,
    data_residency VARCHAR(10) DEFAULT 'US' CHECK (data_residency IN ('US', 'EU', 'GLOBAL')),
    zero_retention_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, workspace_id, provider_name, key_label)
);

-- AI Model Aliases - User-defined aliases with fallback chains
CREATE TABLE ai_model_aliases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    alias_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('text', 'image', 'audio', 'video')),
    capability VARCHAR(30) NOT NULL CHECK (capability IN ('chat', 'completion', 'embedding', 'generate', 'edit', 'variation', 'stt', 'tts', 'caption')),
    primary_provider VARCHAR(50) NOT NULL,
    primary_model VARCHAR(100) NOT NULL,
    fallback_chain JSONB DEFAULT '[]'::jsonb,
    routing_preference VARCHAR(20) DEFAULT 'quality' CHECK (routing_preference IN ('quality', 'speed', 'cost')),
    allow_aggregators BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, workspace_id, alias_name)
);

-- AI Provider Budgets - Budget tracking per provider/alias
CREATE TABLE ai_provider_budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    provider_key_id BIGINT NOT NULL,
    budget_period VARCHAR(20) DEFAULT 'monthly' CHECK (budget_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    budget_limit_usd NUMERIC(10,2) NOT NULL,
    token_limit BIGINT DEFAULT 0,
    request_limit INTEGER DEFAULT 0,
    current_spend_usd NUMERIC(10,6) DEFAULT 0,
    current_tokens BIGINT DEFAULT 0,
    current_requests INTEGER DEFAULT 0,
    warning_threshold NUMERIC(3,2) DEFAULT 0.80,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Call Logs - Comprehensive audit trail of all AI operations
CREATE TABLE ai_call_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    alias_name VARCHAR(50) NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    modality VARCHAR(20) NOT NULL,
    capability VARCHAR(30) NOT NULL,
    request_id VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    input_characters INTEGER DEFAULT 0,
    output_characters INTEGER DEFAULT 0,
    media_seconds NUMERIC(8,2) DEFAULT 0,
    media_frames INTEGER DEFAULT 0,
    cost_estimate_usd NUMERIC(10,6) DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'rate_limited', 'budget_exceeded', 'fallback_used')),
    error_code VARCHAR(50),
    error_message TEXT,
    fallback_used BOOLEAN DEFAULT false,
    fallback_reason VARCHAR(100),
    provider_of_record VARCHAR(50) NOT NULL,
    request_metadata JSONB DEFAULT '{}'::jsonb,
    response_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Usage Summaries - Aggregated usage data for reporting
CREATE TABLE ai_usage_summaries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    alias_name VARCHAR(50),
    summary_date DATE NOT NULL,
    summary_period VARCHAR(20) DEFAULT 'daily' CHECK (summary_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    fallback_calls INTEGER DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    total_cost_usd NUMERIC(10,6) DEFAULT 0,
    avg_latency_ms NUMERIC(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, workspace_id, provider_name, COALESCE(alias_name, ''), summary_date, summary_period)
);

-- Update existing ai_providers table to include more metadata
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2));
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS is_aggregator BOOLEAN DEFAULT false;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS supported_modalities JSONB DEFAULT '["text"]'::jsonb;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS pricing_model JSONB DEFAULT '{}'::jsonb;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS rate_limits JSONB DEFAULT '{}'::jsonb;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS data_residency VARCHAR(10) DEFAULT 'GLOBAL';

-- Create indexes for performance
CREATE INDEX idx_ai_provider_keys_user_workspace ON ai_provider_keys(user_id, workspace_id);
CREATE INDEX idx_ai_provider_keys_provider ON ai_provider_keys(provider_name);
CREATE INDEX idx_ai_provider_keys_status ON ai_provider_keys(status);

CREATE INDEX idx_ai_model_aliases_user_workspace ON ai_model_aliases(user_id, workspace_id);
CREATE INDEX idx_ai_model_aliases_modality ON ai_model_aliases(modality);
CREATE INDEX idx_ai_model_aliases_active ON ai_model_aliases(is_active);

CREATE INDEX idx_ai_provider_budgets_user_workspace ON ai_provider_budgets(user_id, workspace_id);
CREATE INDEX idx_ai_provider_budgets_provider_key ON ai_provider_budgets(provider_key_id);

CREATE INDEX idx_ai_call_logs_user_workspace ON ai_call_logs(user_id, workspace_id);
CREATE INDEX idx_ai_call_logs_alias ON ai_call_logs(alias_name);
CREATE INDEX idx_ai_call_logs_provider ON ai_call_logs(provider_name);
CREATE INDEX idx_ai_call_logs_created_at ON ai_call_logs(created_at);
CREATE INDEX idx_ai_call_logs_status ON ai_call_logs(status);

CREATE INDEX idx_ai_usage_summaries_user_workspace ON ai_usage_summaries(user_id, workspace_id);
CREATE INDEX idx_ai_usage_summaries_date ON ai_usage_summaries(summary_date);
CREATE INDEX idx_ai_usage_summaries_provider ON ai_usage_summaries(provider_name);

-- Enable RLS for all new tables
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_provider_keys
CREATE POLICY ai_provider_keys_select_policy ON ai_provider_keys
    FOR SELECT USING (user_id = uid());
CREATE POLICY ai_provider_keys_insert_policy ON ai_provider_keys
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY ai_provider_keys_update_policy ON ai_provider_keys
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ai_provider_keys_delete_policy ON ai_provider_keys
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for ai_model_aliases
CREATE POLICY ai_model_aliases_select_policy ON ai_model_aliases
    FOR SELECT USING (user_id = uid());
CREATE POLICY ai_model_aliases_insert_policy ON ai_model_aliases
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY ai_model_aliases_update_policy ON ai_model_aliases
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ai_model_aliases_delete_policy ON ai_model_aliases
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for ai_provider_budgets
CREATE POLICY ai_provider_budgets_select_policy ON ai_provider_budgets
    FOR SELECT USING (user_id = uid());
CREATE POLICY ai_provider_budgets_insert_policy ON ai_provider_budgets
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY ai_provider_budgets_update_policy ON ai_provider_budgets
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ai_provider_budgets_delete_policy ON ai_provider_budgets
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for ai_call_logs
CREATE POLICY ai_call_logs_select_policy ON ai_call_logs
    FOR SELECT USING (user_id = uid());
CREATE POLICY ai_call_logs_insert_policy ON ai_call_logs
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY ai_call_logs_update_policy ON ai_call_logs
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ai_call_logs_delete_policy ON ai_call_logs
    FOR DELETE USING (user_id = uid());

-- Create RLS policies for ai_usage_summaries
CREATE POLICY ai_usage_summaries_select_policy ON ai_usage_summaries
    FOR SELECT USING (user_id = uid());
CREATE POLICY ai_usage_summaries_insert_policy ON ai_usage_summaries
    FOR INSERT WITH CHECK (user_id = uid());
CREATE POLICY ai_usage_summaries_update_policy ON ai_usage_summaries
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ai_usage_summaries_delete_policy ON ai_usage_summaries
    FOR DELETE USING (user_id = uid());

-- Insert default AI providers
INSERT INTO ai_providers (name, display_name, description, api_base_url, tier, is_aggregator, supported_modalities, pricing_model, data_residency, is_active, sort_order) VALUES
-- Tier 1 Direct Providers
('openai', 'OpenAI', 'GPT-4, DALL-E, Whisper models', 'https://api.openai.com/v1', 1, false, '["text", "image", "audio"]', '{"text": {"input": 0.03, "output": 0.06}, "image": {"generate": 0.04}}', 'GLOBAL', true, 1),
('anthropic', 'Anthropic', 'Claude 3.5 family models', 'https://api.anthropic.com', 1, false, '["text"]', '{"text": {"input": 0.03, "output": 0.15}}', 'US', true, 2),
('google', 'Google AI', 'Gemini 1.5/2.x models', 'https://generativelanguage.googleapis.com/v1', 1, false, '["text", "image", "video"]', '{"text": {"input": 0.0125, "output": 0.05}}', 'GLOBAL', true, 3),
('mistral', 'Mistral AI', 'Large and Medium models', 'https://api.mistral.ai/v1', 1, false, '["text"]', '{"text": {"input": 0.02, "output": 0.06}}', 'EU', true, 4),
('groq', 'Groq', 'Ultra-low latency Llama models', 'https://api.groq.com/openai/v1', 1, false, '["text"]', '{"text": {"input": 0.001, "output": 0.002}}', 'US', true, 5),
('zhipu', 'Zhipu AI', 'GLM-4.5 models', 'https://open.bigmodel.cn/api/paas/v4', 1, false, '["text"]', '{"text": {"input": 0.01, "output": 0.03}}', 'GLOBAL', true, 6),
('stability', 'Stability AI', 'SDXL image generation', 'https://api.stability.ai', 1, false, '["image"]', '{"image": {"generate": 0.04}}', 'GLOBAL', true, 7),
('deepgram', 'Deepgram', 'Speech-to-text transcription', 'https://api.deepgram.com/v1', 1, false, '["audio"]', '{"audio": {"stt": 0.0043}}', 'US', true, 8),
('elevenlabs', 'ElevenLabs', 'Text-to-speech synthesis', 'https://api.elevenlabs.io/v1', 1, false, '["audio"]', '{"audio": {"tts": 0.18}}', 'GLOBAL', true, 9),
('runway', 'Runway', 'Gen-3 video generation', 'https://api.runwayml.com/v1', 1, false, '["video"]', '{"video": {"generate": 0.95}}', 'US', true, 10),
('pika', 'Pika Labs', 'Video generation and editing', 'https://api.pika.art/v1', 1, false, '["video"]', '{"video": {"generate": 0.80}}', 'US', true, 11),
('klingai', 'KlingAI', 'Advanced video synthesis', 'https://api.klingai.com/v1', 1, false, '["video"]', '{"video": {"generate": 0.85}}', 'GLOBAL', true, 12),

-- Tier 2 Aggregators
('openrouter', 'OpenRouter', 'Broad LLM access aggregator', 'https://openrouter.ai/api/v1', 2, true, '["text"]', '{"text": {"varies": true}}', 'GLOBAL', true, 20),
('replicate', 'Replicate', 'OSS models without hosting GPUs', 'https://api.replicate.com/v1', 2, true, '["text", "image", "audio", "video"]', '{"varies": true}', 'US', true, 21),
('fireworks', 'Fireworks AI', 'Fast inference for OSS models', 'https://api.fireworks.ai/inference/v1', 2, true, '["text", "image"]', '{"text": {"input": 0.0002, "output": 0.0016}}', 'US', true, 22);

-- Admin account has been initialized with user id 1, create default profile
INSERT INTO user_profiles (user_id) VALUES (1) ON CONFLICT (user_id) DO NOTHING;
