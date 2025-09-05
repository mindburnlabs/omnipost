

import { api } from '@/lib/api-client';
import {
  Post,
  PlatformConnection,
  PostPlatform,
  ContentAsset,
  ContentTemplate,
  ContentSnippet,
  AnalyticsMetric,
  PostingTimeRecommendation,
  UserActivity,
  SchedulingConflict,
  ContentValidation,
  UserProfile,
  BestTimeDTO,
  BestTime
} from '@/types/omnipost';
import { ENABLE_AUTH, DEFAULT_DEV_USER_ID } from '@/constants/auth';

// HARDENED: Removed all mock data fallbacks - real API calls or errors
// Demo data is only provided by the demo workspace seeding

// Generate mock user ID for development
const getMockUserId = () => !ENABLE_AUTH ? DEFAULT_DEV_USER_ID : 1;

// Helper function to normalize BestTime data
function normalizeBestTime(dto: BestTimeDTO): BestTime {
  return {
    ...dto,
    confidence: dto.confidence ?? 'medium', // Default to 'medium' if not provided
  };
}

// Posts API
export const postsApi = {
  getAll: (params?: { limit?: number; offset?: number; status?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    if (params?.offset !== undefined) queryParams.offset = params.offset.toString();
    if (params?.status) queryParams.status = params.status;
    
    return api.get<Post[]>('/posts', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
  
  getById: (id: number) =>
    api.get<Post>(`/posts/${id}`),
  
  create: (data: Partial<Post>) =>
    api.post<Post>('/posts', data),
  
  update: (id: number, data: Partial<Post>) =>
    api.put<Post>(`/posts/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/posts/${id}`),
  
  schedule: (id: number, scheduledAt: string) =>
    api.put<Post>(`/posts/${id}/schedule`, { scheduled_at: scheduledAt }),
  
  publish: (id: number) =>
    api.post<Post>(`/posts/${id}/publish`),

  retry: (id: number) =>
    api.post<Post>(`/posts/${id}/retry`),

  testPublish: (id: number) =>
    api.post(`/posts/${id}/test-publish`),
};

// Platform Connections API
export const platformConnectionsApi = {
  getAll: () =>
    api.get<PlatformConnection[]>('/platform-connections'),
  
  getById: (id: number) =>
    api.get<PlatformConnection>(`/platform-connections/${id}`),
  
  create: (data: Partial<PlatformConnection>) =>
    api.post<PlatformConnection>('/platform-connections', data),
  
  update: (id: number, data: Partial<PlatformConnection>) =>
    api.put<PlatformConnection>(`/platform-connections/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/platform-connections/${id}`),
  
  testConnection: (id: number) =>
    api.post<{ success: boolean; message: string }>(`/platform-connections/${id}/test`),
};

// Content Assets API
export const contentAssetsApi = {
  getAll: (params?: { limit?: number; offset?: number; file_type?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    if (params?.offset !== undefined) queryParams.offset = params.offset.toString();
    if (params?.file_type) queryParams.file_type = params.file_type;
    
    return api.get<ContentAsset[]>('/content-assets', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
  
  getById: (id: number) =>
    api.get<ContentAsset>(`/content-assets/${id}`),
  
  upload: (file: File, metadata?: Record<string, any>) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return api.post<ContentAsset>('/content-assets/upload', formData);
  },
  
  delete: (id: number) =>
    api.delete(`/content-assets/${id}`),
};

// Content Templates API
export const contentTemplatesApi = {
  getAll: (params?: { limit?: number; offset?: number; template_type?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    if (params?.offset !== undefined) queryParams.offset = params.offset.toString();
    if (params?.template_type) queryParams.template_type = params.template_type;
    
    return api.get<ContentTemplate[]>('/content-templates', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
  
  getById: (id: number) =>
    api.get<ContentTemplate>(`/content-templates/${id}`),
  
  create: (data: Partial<ContentTemplate>) =>
    api.post<ContentTemplate>('/content-templates', data),
  
  update: (id: number, data: Partial<ContentTemplate>) =>
    api.put<ContentTemplate>(`/content-templates/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/content-templates/${id}`),
};

// Content Snippets API
export const contentSnippetsApi = {
  getAll: (params?: { limit?: number; offset?: number; category?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    if (params?.offset !== undefined) queryParams.offset = params.offset.toString();
    if (params?.category) queryParams.category = params.category;
    
    return api.get<ContentSnippet[]>('/content-snippets', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
  
  getById: (id: number) =>
    api.get<ContentSnippet>(`/content-snippets/${id}`),
  
  create: (data: Partial<ContentSnippet>) =>
    api.post<ContentSnippet>('/content-snippets', data),
  
  update: (id: number, data: Partial<ContentSnippet>) =>
    api.put<ContentSnippet>(`/content-snippets/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/content-snippets/${id}`),
};

// Analytics API
export const analyticsApi = {
  getMetrics: (params?: { 
    start_date?: string; 
    end_date?: string; 
    platform_type?: string;
    metric_type?: string;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    if (params?.platform_type) queryParams.platform_type = params.platform_type;
    if (params?.metric_type) queryParams.metric_type = params.metric_type;
    
    return api.get<AnalyticsMetric[]>('/analytics/metrics', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
  
  getDashboardData: () =>
    api.get<{
      totalReach: number;
      totalEngagement: number;
      totalClicks: number;
      engagementRate: number;
      clickThroughRate: number;
      topPosts: Post[];
      platformPerformance: Array<{
        platform: string;
        metrics: Record<string, number>;
      }>;
    }>('/analytics/dashboard'),
  
  getTimingHeatmap: (platform?: string) => {
    const queryParams: Record<string, string> = {};
    if (platform) queryParams.platform = platform;
    
    return api.get<Array<{
      day: number;
      hour: number;
      engagement: number;
      postCount: number;
    }>>('/analytics/timing-heatmap', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },

  exportData: (params: {
    start_date: string;
    end_date: string;
    format: 'csv' | 'json';
  }) =>
    api.post('/analytics/export', params),
};

// Posting Time Recommendations API
export const postingTimeApi = {
  getRecommendations: (platform?: string) => {
    const queryParams: Record<string, string> = {};
    if (platform) queryParams.platform = platform;
    
    return api.get<PostingTimeRecommendation[]>('/posting-time-recommendations', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
  
  getBestTimes: async (platform?: string, timezone?: string): Promise<BestTime[]> => {
    const queryParams: Record<string, string> = {};
    if (platform) queryParams.platform = platform;
    if (timezone) queryParams.timezone = timezone;
    
    try {
      const timesDTO = await api.get<BestTimeDTO[]>('/posting-time-recommendations/best-times', Object.keys(queryParams).length > 0 ? queryParams : undefined);
      
      // Normalize the data to ensure confidence is always a string
      return timesDTO.map(normalizeBestTime);
    } catch (error) {
      console.error('getBestTimes failed:', error);
      throw error;
    }
  },

  updateRecommendations: (timezone?: string) =>
    api.post('/posting-time-recommendations/update', { timezone }),
};

// User Activities API
export const userActivitiesApi = {
  getRecent: (limit = 10) => {
    const queryParams: Record<string, string> = { limit: limit.toString() };
    
    return api.get<UserActivity[]>('/user-activities', queryParams);
  },
  
  create: (data: Partial<UserActivity>) =>
    api.post<UserActivity>('/user-activities', data),
};

// Scheduling Conflicts API
export const schedulingConflictsApi = {
  getAll: (resolved = false) => {
    const queryParams: Record<string, string> = { resolved: resolved.toString() };
    
    return api.get<SchedulingConflict[]>('/scheduling-conflicts', queryParams);
  },
  
  resolve: (id: number) =>
    api.put<SchedulingConflict>(`/scheduling-conflicts/${id}/resolve`),
};

// Content Validation API
export const contentValidationApi = {
  validatePost: (postId: number) =>
    api.post<ContentValidation[]>(`/content-validation/${postId}/validate`),
  
  getValidations: (postId: number) =>
    api.get<ContentValidation[]>(`/content-validation/${postId}`),

  checkDuplicates: (content: string, title?: string, excludePostId?: number) =>
    api.post('/content-validation/duplicates', { content, title, exclude_post_id: excludePostId }),

  validateLinks: (content: string) =>
    api.post('/content-validation/links', { content }),

  resolveMentions: (content: string, platformType: string, connectionId: number) =>
    api.post('/content-validation/mentions', { content, platform_type: platformType, connection_id: connectionId }),
};

// User Profile API
export const userProfileApi = {
  get: () =>
    api.get<UserProfile>('/user-profile'),
  
  update: (data: Partial<UserProfile>) =>
    api.put<UserProfile>('/user-profile', data),
};

// AI API - Enhanced with configuration support
export const aiApi = {
  generate: (data: {
    prompt: string;
    provider?: 'gemini' | 'openrouter';
    model?: string;
    maxTokens?: number;
    temperature?: number;
    image?: string;
  }) =>
    api.post('/ai/generate', data),
  
  improve: (data: { content: string; instructions?: string }) =>
    api.post('/ai/improve', data),
  
  optimize: (data: { content: string; platform: string }) =>
    api.post('/ai/optimize', data),
  
  generateHashtags: (data: { content: string; count?: number }) =>
    api.post('/ai/hashtags', data),
  
  generateIdeas: (data: { topic: string; platform?: string; count?: number }) =>
    api.post('/ai/ideas', data),
  
  generateVariants: (data: { content: string; count?: number }) =>
    api.post('/ai/ab-variants', data),
  
  analyzeImage: (data: { image: string; prompt?: string }) =>
    api.post('/ai/analyze-image', data),
  
  getModels: () =>
    api.get('/ai/models'),

  // AI Configuration endpoints
  getConfiguration: () =>
    api.get('/ai/configuration'),
  
  saveConfiguration: (data: {
    provider: string;
    api_key: string;
    model?: string;
    is_default?: boolean;
  }) =>
    api.post('/ai/configuration', data),
  
  validateConfiguration: (data: {
    provider: string;
    api_key: string;
    model?: string;
  }) =>
    api.post('/ai/configuration/validate', data),
  
  deleteConfiguration: (id: number) =>
    api.delete(`/ai/configuration/${id}`),

  getUsage: (params?: { provider?: string; start_date?: string; end_date?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.provider) queryParams.provider = params.provider;
    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    
    return api.get('/ai/usage', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
};

// Workspaces API
export const workspacesApi = {
  getAll: () =>
    api.get('/workspaces'),
  
  create: (data: { name: string; slug: string; description?: string; is_demo?: boolean }) =>
    api.post('/workspaces', data),
  
  resetDemo: () =>
    api.post('/workspaces/demo/reset'),
  
  seedDemo: () =>
    api.post('/workspaces/demo/seed'),
};

// A/B Experiments API
export const experimentsApi = {
  getAll: (status?: string) => {
    const queryParams: Record<string, string> = {};
    if (status) queryParams.status = status;
    
    return api.get('/ab-experiments', Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
  
  create: (data: {
    name: string;
    description?: string;
    variants: Array<{
      name: string;
      post_id: number;
      traffic_percentage: number;
    }>;
  }) =>
    api.post('/ab-experiments', data),
  
  analyze: (experimentId: number) =>
    api.post(`/ab-experiments/${experimentId}/analyze`),
  
  promoteWinner: (experimentId: number, winnerVariantId: number) =>
    api.post(`/ab-experiments/${experimentId}/promote-winner`, {
      winner_variant_id: winnerVariantId
    }),
};

// Automation Rules API
export const automationApi = {
  getRules: () =>
    api.get('/automation-rules'),
  
  createRule: (data: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_conditions: Record<string, any>;
    actions: Record<string, any>;
    is_active?: boolean;
  }) =>
    api.post('/automation-rules', data),
  
  updateRule: (id: number, data: Partial<any>) =>
    api.put(`/automation-rules/${id}`, data),
  
  deleteRule: (id: number) =>
    api.delete(`/automation-rules/${id}`),

  dryRun: (ruleId: number) =>
    api.post(`/automation-rules/${ruleId}/dry-run`),

  getRunHistory: (ruleId: number, limit?: number) => {
    const queryParams: Record<string, string> = {};
    if (limit) queryParams.limit = limit.toString();
    
    return api.get(`/automation-rules/${ruleId}/history`, Object.keys(queryParams).length > 0 ? queryParams : undefined);
  },
};

// Brand Kits API
export const brandKitsApi = {
  getAll: () =>
    api.get('/brand-kits'),
  
  create: (data: {
    name: string;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    tone_guidelines?: string;
    banned_words?: string[];
    utm_templates?: Record<string, any>;
  }) =>
    api.post('/brand-kits', data),
  
  update: (id: number, data: Partial<any>) =>
    api.put(`/brand-kits/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/brand-kits/${id}`),
};

// Repost Guard API
export const repostGuardApi = {
  checkDuplicates: (data: {
    content: string;
    title?: string;
    exclude_post_id?: number;
  }) =>
    api.post('/repost-guard/check', data),

  checkImageDuplicates: (data: {
    image_url: string;
    exclude_post_id?: number;
  }) =>
    api.post('/repost-guard/check-image', data),
};

// System API
export const systemApi = {
  getHealth: () =>
    api.get('/system/health'),

  getQueueStats: () =>
    api.get('/system/queue-stats'),

  checkMigration: () =>
    api.post('/database/migrate'),
};

