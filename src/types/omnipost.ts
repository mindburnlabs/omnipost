

export interface Post {
  id: number;
  user_id: number;
  title?: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'link' | 'mixed';
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';
  scheduled_at?: string;
  published_at?: string;
  metadata: Record<string, unknown>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface PlatformConnection {
  id: number;
  user_id: number;
  platform_type: 'discord' | 'telegram' | 'whop';
  connection_name: string;
  api_credentials: Record<string, unknown>;
  connection_status: 'active' | 'inactive' | 'error' | 'expired';
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PostPlatform {
  id: number;
  post_id: number;
  platform_connection_id: number;
  platform_specific_content?: Record<string, unknown>;
  publish_status: 'pending' | 'published' | 'failed' | 'skipped';
  platform_post_id?: string;
  error_message?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAsset {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  usage_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentTemplate {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  template_content: string;
  template_type: 'general' | 'announcement' | 'promotion' | 'update' | 'question';
  platform_specific: Record<string, unknown>;
  usage_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentSnippet {
  id: number;
  user_id: number;
  name: string;
  content: string;
  category?: string;
  usage_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetric {
  id: number;
  user_id: number;
  post_id?: number;
  platform_connection_id?: number;
  metric_type: 'views' | 'likes' | 'shares' | 'comments' | 'clicks' | 'reach' | 'impressions';
  metric_value: number;
  recorded_at: string;
  created_at: string;
}

export interface PostingTimeRecommendation {
  id: number;
  user_id: number;
  platform_type: 'discord' | 'telegram' | 'whop';
  day_of_week: number;
  hour_of_day: number;
  engagement_score: number;
  recommendation_strength: 'low' | 'medium' | 'high';
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: number;
  user_id: number;
  activity_type: string;
  activity_description: string;
  related_entity_type?: string;
  related_entity_id?: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SchedulingConflict {
  id: number;
  user_id: number;
  post_id: number;
  conflicting_post_id: number;
  conflict_type: 'time_overlap' | 'platform_limit' | 'content_similarity';
  conflict_severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentValidation {
  id: number;
  post_id: number;
  validation_type: 'link_check' | 'image_size' | 'character_count' | 'platform_compliance' | 'spam_check';
  validation_status: 'passed' | 'failed' | 'warning';
  validation_message?: string;
  validation_details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  display_name?: string;
  avatar_url?: string;
  timezone: string;
  preferred_language: string;
  notification_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Best Time Types - Separate DTO from UI types
export interface BestTimeDTO {
  day: string;
  time: string;
  score: number;
  confidence?: string; // optional in API payload
  timezone: string;
  localTime: string;
  engagementData: {
    avgLikes: number;
    avgShares: number;
    avgComments: number;
    sampleSize: number;
  };
}

export interface BestTime {
  day: string;
  time: string;
  score: number;
  confidence: string; // required in UI state
  timezone: string;
  localTime: string;
  engagementData: {
    avgLikes: number;
    avgShares: number;
    avgComments: number;
    sampleSize: number;
  };
}

