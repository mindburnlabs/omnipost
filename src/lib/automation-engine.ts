
// Real automation engine with executable rules, dry-run previews, and burst protection
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';
import { getPublishingEngine } from './publishing-engine';

export interface AutomationRule {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  last_run_at?: string;
  run_count: number;
  burst_protection: {
    max_runs_per_hour: number;
    max_runs_per_day: number;
    current_hour_runs: number;
    current_day_runs: number;
    last_reset_hour: string;
    last_reset_day: string;
  };
}

export interface DryRunResult {
  ruleId: number;
  ruleName: string;
  wouldTrigger: boolean;
  actions: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
    estimatedOutcome: string;
  }>;
  burstProtectionStatus: {
    allowed: boolean;
    reason?: string;
    remainingRuns: number;
  };
}

export interface AutomationRunResult {
  ruleId: number;
  success: boolean;
  actionsExecuted: number;
  error?: string;
  executionTime: number;
  outputs: Array<{
    action: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

export class AutomationEngine {
  private adminToken: string | null = null;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.adminToken = await generateAdminUserToken();
    this.startProcessing();
  }

  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process automation rules every 5 minutes
    this.processingInterval = setInterval(() => {
      this.processActiveRules();
    }, 5 * 60 * 1000);

    // Process immediately on start
    this.processActiveRules();
  }

  async processActiveRules(): Promise<void> {
    if (this.isProcessing || !this.adminToken) {
      return;
    }

    this.isProcessing = true;

    try {
      const rulesCrud = new CrudOperations('automation_rules', this.adminToken);
      const activeRules = await rulesCrud.findMany(
        { is_active: true },
        { orderBy: { column: 'last_run_at', direction: 'asc' } }
      );

      console.log(`Processing ${activeRules.length} active automation rules`);

      for (const rule of activeRules) {
        await this.processRule(rule);
      }
    } catch (error) {
      console.error('Error processing automation rules:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processRule(rule: any): Promise<void> {
    try {
      // Check burst protection
      const burstCheck = this.checkBurstProtection(rule);
      if (!burstCheck.allowed) {
        console.log(`Rule ${rule.id} blocked by burst protection: ${burstCheck.reason}`);
        return;
      }

      // Check if rule should trigger
      const shouldTrigger = await this.evaluateTrigger(rule);
      if (!shouldTrigger) {
        return;
      }

      // Execute rule
      const result = await this.executeRule(rule);
      
      // Update rule statistics
      await this.updateRuleStats(rule.id, result);

      console.log(`Rule ${rule.id} executed: ${result.success ? 'success' : 'failed'}`);
    } catch (error) {
      console.error(`Error processing rule ${rule.id}:`, error);
    }
  }

  private checkBurstProtection(rule: any): { allowed: boolean; reason?: string; remainingRuns: number } {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();

    const burstConfig = rule.burst_protection || {
      max_runs_per_hour: 10,
      max_runs_per_day: 50,
      current_hour_runs: 0,
      current_day_runs: 0,
      last_reset_hour: now.toISOString(),
      last_reset_day: now.toISOString()
    };

    // Reset counters if needed
    const lastResetHour = new Date(burstConfig.last_reset_hour);
    const lastResetDay = new Date(burstConfig.last_reset_day);

    if (lastResetHour.getHours() !== currentHour) {
      burstConfig.current_hour_runs = 0;
      burstConfig.last_reset_hour = now.toISOString();
    }

    if (lastResetDay.getDate() !== currentDay) {
      burstConfig.current_day_runs = 0;
      burstConfig.last_reset_day = now.toISOString();
    }

    // Check limits
    if (burstConfig.current_hour_runs >= burstConfig.max_runs_per_hour) {
      return {
        allowed: false,
        reason: `Hourly limit reached (${burstConfig.max_runs_per_hour})`,
        remainingRuns: 0
      };
    }

    if (burstConfig.current_day_runs >= burstConfig.max_runs_per_day) {
      return {
        allowed: false,
        reason: `Daily limit reached (${burstConfig.max_runs_per_day})`,
        remainingRuns: 0
      };
    }

    return {
      allowed: true,
      remainingRuns: Math.min(
        burstConfig.max_runs_per_hour - burstConfig.current_hour_runs,
        burstConfig.max_runs_per_day - burstConfig.current_day_runs
      )
    };
  }

  private async evaluateTrigger(rule: any): Promise<boolean> {
    const { trigger_type, trigger_conditions } = rule;

    switch (trigger_type) {
      case 'schedule':
        return this.evaluateScheduleTrigger(trigger_conditions, rule.last_run_at);
      
      case 'engagement_threshold':
        return await this.evaluateEngagementTrigger(trigger_conditions, rule.user_id);
      
      case 'new_post':
        return await this.evaluateNewPostTrigger(trigger_conditions, rule.user_id, rule.last_run_at);
      
      case 'hashtag':
        return await this.evaluateHashtagTrigger(trigger_conditions, rule.user_id);
      
      default:
        console.warn(`Unknown trigger type: ${trigger_type}`);
        return false;
    }
  }

  private evaluateScheduleTrigger(conditions: any, lastRunAt?: string): boolean {
    const now = new Date();
    const { frequency, day_of_week, hour } = conditions;

    if (frequency === 'weekly') {
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      
      if (currentDay !== day_of_week || currentHour !== hour) {
        return false;
      }

      // Check if already ran this week
      if (lastRunAt) {
        const lastRun = new Date(lastRunAt);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        if (lastRun >= weekStart) {
          return false; // Already ran this week
        }
      }

      return true;
    }

    return false;
  }

  private async evaluateEngagementTrigger(conditions: any, userId: number): Promise<boolean> {
    try {
      const metricsCrud = new CrudOperations('analytics_metrics', this.adminToken!);
      const postsCrud = new CrudOperations('posts', this.adminToken!);

      const { metric, threshold, time_window } = conditions;
      
      // Get recent posts within time window
      const timeWindowMs = this.parseTimeWindow(time_window);
      const cutoffTime = new Date(Date.now() - timeWindowMs);

      const recentPosts = await postsCrud.findMany(
        { 
          user_id: userId, 
          status: 'published'
        },
        { 
          limit: 50,
          orderBy: { column: 'published_at', direction: 'desc' }
        }
      );

      const postsInWindow = recentPosts.filter(post => 
        post.published_at && new Date(post.published_at) >= cutoffTime
      );

      // Check if any post exceeds threshold
      for (const post of postsInWindow) {
        const metrics = await metricsCrud.findMany({
          post_id: post.id,
          metric_type: metric
        });

        const totalMetric = metrics.reduce((sum, m) => sum + m.metric_value, 0);
        if (totalMetric >= threshold) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error evaluating engagement trigger:', error);
      return false;
    }
  }

  private async evaluateNewPostTrigger(conditions: any, userId: number, lastRunAt?: string): Promise<boolean> {
    try {
      const postsCrud = new CrudOperations('posts', this.adminToken!);
      
      const cutoffTime = lastRunAt ? new Date(lastRunAt) : new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      const newPosts = await postsCrud.findMany(
        { user_id: userId, status: 'published' },
        { limit: 10, orderBy: { column: 'published_at', direction: 'desc' } }
      );

      return newPosts.some(post => 
        post.published_at && new Date(post.published_at) > cutoffTime
      );
    } catch (error) {
      console.error('Error evaluating new post trigger:', error);
      return false;
    }
  }

  private async evaluateHashtagTrigger(conditions: any, userId: number): Promise<boolean> {
    try {
      const postsCrud = new CrudOperations('posts', this.adminToken!);
      
      const { hashtag, time_window } = conditions;
      const timeWindowMs = this.parseTimeWindow(time_window || '1h');
      const cutoffTime = new Date(Date.now() - timeWindowMs);

      const recentPosts = await postsCrud.findMany(
        { user_id: userId, status: 'published' },
        { limit: 20, orderBy: { column: 'published_at', direction: 'desc' } }
      );

      return recentPosts.some(post => 
        post.published_at && 
        new Date(post.published_at) >= cutoffTime &&
        post.tags?.includes(hashtag)
      );
    } catch (error) {
      console.error('Error evaluating hashtag trigger:', error);
      return false;
    }
  }

  private parseTimeWindow(timeWindow: string): number {
    const match = timeWindow.match(/^(\d+)([hdw])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  async executeRule(rule: any): Promise<AutomationRunResult> {
    const startTime = Date.now();
    const outputs: Array<{
      action: string;
      success: boolean;
      result?: any;
      error?: string;
    }> = [];

    try {
      const { actions } = rule;
      let actionsExecuted = 0;

      for (const [actionType, actionConfig] of Object.entries(actions)) {
        try {
          const result = await this.executeAction(actionType, actionConfig as any, rule.user_id);
          outputs.push({
            action: actionType,
            success: true,
            result
          });
          actionsExecuted++;
        } catch (error) {
          outputs.push({
            action: actionType,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        ruleId: rule.id,
        success: outputs.every(o => o.success),
        actionsExecuted,
        executionTime: Date.now() - startTime,
        outputs
      };
    } catch (error) {
      return {
        ruleId: rule.id,
        success: false,
        actionsExecuted: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        outputs
      };
    }
  }

  private async executeAction(actionType: string, actionConfig: any, userId: number): Promise<any> {
    switch (actionType) {
      case 'create_post':
        return await this.executeCreatePostAction(actionConfig, userId);
      
      case 'repost':
        return await this.executeRepostAction(actionConfig, userId);
      
      case 'send_notification':
        return await this.executeSendNotificationAction(actionConfig, userId);
      
      case 'update_template':
        return await this.executeUpdateTemplateAction(actionConfig, userId);
      
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  private async executeCreatePostAction(config: any, userId: number): Promise<any> {
    const postsCrud = new CrudOperations('posts', this.adminToken!);
    
    const postData = {
      user_id: userId,
      title: config.title,
      content: config.content,
      content_type: 'text',
      status: config.auto_publish ? 'scheduled' : 'draft',
      scheduled_at: config.auto_publish ? new Date().toISOString() : undefined,
      tags: config.tags || [],
      metadata: {
        automation_generated: true,
        platforms: config.platforms || [],
        automation_rule_id: config.rule_id
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const post = await postsCrud.create(postData);

    if (config.auto_publish) {
      const publishingEngine = await getPublishingEngine();
      await publishingEngine.publishNow(post.id);
    }

    return { postId: post.id, autoPublished: config.auto_publish };
  }

  private async executeRepostAction(config: any, userId: number): Promise<any> {
    const postsCrud = new CrudOperations('posts', this.adminToken!);
    
    // Find the original post
    const originalPost = await postsCrud.findById(config.original_post_id);
    if (!originalPost) {
      throw new Error('Original post not found');
    }

    // Create repost with modifications
    const repostContent = config.add_text 
      ? `${config.add_text}\n\n${originalPost.content}`
      : originalPost.content;

    const repostData = {
      user_id: userId,
      title: originalPost.title,
      content: repostContent,
      content_type: originalPost.content_type,
      status: 'scheduled',
      scheduled_at: config.delay ? new Date(Date.now() + this.parseTimeWindow(config.delay)).toISOString() : new Date().toISOString(),
      tags: [...(originalPost.tags || []), 'repost'],
      metadata: {
        automation_generated: true,
        repost_of: originalPost.id,
        platforms: config.platforms || originalPost.metadata?.platforms || []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const repost = await postsCrud.create(repostData);
    return { repostId: repost.id, originalPostId: originalPost.id };
  }

  private async executeSendNotificationAction(config: any, userId: number): Promise<any> {
    const notificationsCrud = new CrudOperations('user_notifications', this.adminToken!);
    
    const notification = await notificationsCrud.create({
      user_id: userId,
      type: config.type || 'automation',
      title: config.title,
      message: config.message,
      data: config.data || {},
      read: false,
      created_at: new Date().toISOString()
    });

    return { notificationId: notification.id };
  }

  private async executeUpdateTemplateAction(config: any, userId: number): Promise<any> {
    const templatesCrud = new CrudOperations('content_templates', this.adminToken!);
    
    const template = await templatesCrud.findById(config.template_id);
    if (!template || template.user_id !== userId) {
      throw new Error('Template not found or access denied');
    }

    const updateData = {
      ...config.updates,
      updated_at: new Date().toISOString()
    };

    const updatedTemplate = await templatesCrud.update(config.template_id, updateData);
    return { templateId: updatedTemplate.id, updates: config.updates };
  }

  async dryRunRule(ruleId: number): Promise<DryRunResult> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const rulesCrud = new CrudOperations('automation_rules', this.adminToken!);
      const rule = await rulesCrud.findById(ruleId);
      
      if (!rule) {
        throw new Error('Rule not found');
      }

      // Check if rule would trigger
      const wouldTrigger = await this.evaluateTrigger(rule);
      
      // Check burst protection
      const burstProtectionStatus = this.checkBurstProtection(rule);

      // Simulate actions
      const actions = [];
      for (const [actionType, actionConfig] of Object.entries(rule.actions)) {
        actions.push({
          type: actionType,
          description: this.getActionDescription(actionType, actionConfig as any),
          parameters: actionConfig as any,
          estimatedOutcome: this.getEstimatedOutcome(actionType, actionConfig as any)
        });
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        wouldTrigger,
        actions,
        burstProtectionStatus
      };
    } catch (error) {
      throw new Error(`Dry run failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getActionDescription(actionType: string, config: any): string {
    switch (actionType) {
      case 'create_post':
        return `Create new post: "${config.content?.substring(0, 50)}..."`;
      case 'repost':
        return `Repost content from post #${config.original_post_id}`;
      case 'send_notification':
        return `Send notification: "${config.title}"`;
      case 'update_template':
        return `Update template #${config.template_id}`;
      default:
        return `Execute ${actionType}`;
    }
  }

  private getEstimatedOutcome(actionType: string, config: any): string {
    switch (actionType) {
      case 'create_post':
        return config.auto_publish ? 'Post will be published immediately' : 'Draft post will be created';
      case 'repost':
        return config.delay ? `Repost scheduled for ${config.delay} from now` : 'Immediate repost';
      case 'send_notification':
        return 'User will receive in-app notification';
      case 'update_template':
        return 'Template will be updated with new content';
      default:
        return 'Action will be executed';
    }
  }

  private async updateRuleStats(ruleId: number, result: AutomationRunResult): Promise<void> {
    try {
      const rulesCrud = new CrudOperations('automation_rules', this.adminToken!);
      const rule = await rulesCrud.findById(ruleId);
      
      if (!rule) return;

      // Update burst protection counters
      const burstProtection = rule.burst_protection || {
        max_runs_per_hour: 10,
        max_runs_per_day: 50,
        current_hour_runs: 0,
        current_day_runs: 0,
        last_reset_hour: new Date().toISOString(),
        last_reset_day: new Date().toISOString()
      };

      burstProtection.current_hour_runs += 1;
      burstProtection.current_day_runs += 1;

      await rulesCrud.update(ruleId, {
        last_run_at: new Date().toISOString(),
        run_count: rule.run_count + 1,
        burst_protection: burstProtection,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update rule stats:', error);
    }
  }

  async getRunHistory(ruleId: number, limit: number = 20): Promise<Array<{
    timestamp: string;
    success: boolean;
    actionsExecuted: number;
    executionTime: number;
    error?: string;
  }>> {
    // In a real implementation, you'd store run history in a separate table
    // For now, return mock history
    return [
      {
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        success: true,
        actionsExecuted: 1,
        executionTime: 1250
      },
      {
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        success: true,
        actionsExecuted: 1,
        executionTime: 980
      }
    ];
  }

  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }
}

// Global automation engine instance
let automationEngine: AutomationEngine | null = null;

export async function getAutomationEngine(): Promise<AutomationEngine> {
  if (!automationEngine) {
    automationEngine = new AutomationEngine();
    await automationEngine.initialize();
  }
  return automationEngine;
}

// Initialize automation engine on server start
if (typeof window === 'undefined') {
  getAutomationEngine().catch(console.error);
}
