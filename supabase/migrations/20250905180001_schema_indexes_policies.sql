-- Create performance indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX idx_platform_connections_status ON platform_connections(connection_status);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_post_platforms_post_id ON post_platforms(post_id);
CREATE INDEX idx_post_platforms_platform_connection_id ON post_platforms(platform_connection_id);
CREATE INDEX idx_post_platforms_user_id ON post_platforms(user_id);
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
CREATE INDEX idx_content_validations_user_id ON content_validations(user_id);
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_post_approvals_user_id ON post_approvals(user_id);
CREATE INDEX idx_post_approvals_post_id ON post_approvals(post_id);
CREATE INDEX idx_ab_experiments_user_id ON ab_experiments(user_id);
CREATE INDEX idx_ab_experiment_variants_user_id ON ab_experiment_variants(user_id);
CREATE INDEX idx_ab_experiment_variants_experiment_id ON ab_experiment_variants(experiment_id);
CREATE INDEX idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX idx_brand_kits_user_id ON brand_kits(user_id);
CREATE INDEX idx_user_ai_configurations_user_id ON user_ai_configurations(user_id);
CREATE INDEX idx_user_ai_configurations_provider ON user_ai_configurations(provider_name);
CREATE INDEX idx_user_ai_configurations_default ON user_ai_configurations(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider_name);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX idx_ai_generated_content_provider ON ai_generated_content(provider_name);
CREATE INDEX idx_ai_generated_content_post_id ON ai_generated_content(related_post_id);

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
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies using user_id (Supabase auth context)
-- Note: In Supabase, we use auth.uid() for user context

-- User profiles policies
CREATE POLICY "Users can manage their profiles" ON user_profiles
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Platform connections policies
CREATE POLICY "Users can manage their connections" ON platform_connections
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Posts policies
CREATE POLICY "Users can manage their posts" ON posts
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Post platforms policies
CREATE POLICY "Users can manage their post platforms" ON post_platforms
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Content assets policies
CREATE POLICY "Users can manage their assets" ON content_assets
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Content templates policies
CREATE POLICY "Users can manage their templates" ON content_templates
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Content snippets policies
CREATE POLICY "Users can manage their snippets" ON content_snippets
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Scheduling conflicts policies
CREATE POLICY "Users can manage their conflicts" ON scheduling_conflicts
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Posting time recommendations policies
CREATE POLICY "Users can manage their recommendations" ON posting_time_recommendations
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Analytics metrics policies
CREATE POLICY "Users can manage their metrics" ON analytics_metrics
    FOR ALL USING (user_id::text = auth.uid()::text);

-- User activities policies
CREATE POLICY "Users can manage their activities" ON user_activities
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Content validations policies
CREATE POLICY "Users can manage their validations" ON content_validations
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Workspaces policies
CREATE POLICY "Users can manage their workspaces" ON workspaces
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Post approvals policies
CREATE POLICY "Users can manage their approvals" ON post_approvals
    FOR ALL USING (user_id::text = auth.uid()::text);

-- A/B experiments policies
CREATE POLICY "Users can manage their experiments" ON ab_experiments
    FOR ALL USING (user_id::text = auth.uid()::text);

-- A/B experiment variants policies
CREATE POLICY "Users can manage their variants" ON ab_experiment_variants
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Automation rules policies
CREATE POLICY "Users can manage their rules" ON automation_rules
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Brand kits policies
CREATE POLICY "Users can manage their brand kits" ON brand_kits
    FOR ALL USING (user_id::text = auth.uid()::text);

-- User AI configurations policies
CREATE POLICY "Users can manage their AI configs" ON user_ai_configurations
    FOR ALL USING (user_id::text = auth.uid()::text);

-- AI usage logs policies
CREATE POLICY "Users can manage their AI usage" ON ai_usage_logs
    FOR ALL USING (user_id::text = auth.uid()::text);

-- AI generated content policies
CREATE POLICY "Users can manage their AI content" ON ai_generated_content
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Insert supported AI providers (system data, no RLS restrictions)
INSERT INTO ai_providers (name, display_name, description, api_base_url, supported_features, default_models, sort_order) VALUES
('gemini', 'Google Gemini', 'Google''s advanced AI model with text and image capabilities', 'https://generativelanguage.googleapis.com', 
 '{"text_generation": true, "image_analysis": true, "content_optimization": true}',
 '{"text": "models/gemini-2.5-pro", "image": "models/gemini-2.5-flash-image-preview"}', 1),

('openrouter', 'OpenRouter', 'Access to multiple AI models through OpenRouter API', 'https://openrouter.ai/api/v1',
 '{"text_generation": true, "content_optimization": true}',
 '{"text": "deepseek/deepseek-chat-v3.1:free", "alternative": "z-ai/glm-4.5-air:free"}', 2);

-- Create default demo workspace for user ID 1 (if using specific user ID)
INSERT INTO workspaces (user_id, name, slug, description, is_demo, whop_experience_id, settings) 
VALUES (1, 'Demo Workspace', 'demo', 'Demo workspace with sample content', true, 'exp_demo', '{"sandbox_mode": true, "sandbox_publishing": true}')
ON CONFLICT (slug) DO NOTHING;

-- Create default user profile for user ID 1
INSERT INTO user_profiles (user_id, display_name, timezone, notification_preferences) 
VALUES (1, 'Demo User', 'UTC', '{"email": true, "push": true, "schedule_reminders": true}');

-- Create default brand kit for user ID 1
INSERT INTO brand_kits (user_id, name, tone_guidelines, primary_color, secondary_color) 
VALUES (1, 'Default Brand Kit', 'Professional and friendly tone', '#2563eb', '#64748b');
