
// Real A/B experiment engine with winner selection from collected metrics
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';

export interface ExperimentMetrics {
  variantId: number;
  impressions: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  conversionRate: number;
  confidenceInterval: number;
}

export interface WinnerAnalysis {
  winnerVariantId: number;
  confidence: number;
  improvement: number;
  significanceLevel: number;
  recommendPromotion: boolean;
  reason: string;
}

export class ABExperimentEngine {
  private adminToken: string | null = null;

  async initialize() {
    this.adminToken = await generateAdminUserToken();
  }

  async analyzeExperiment(experimentId: number): Promise<WinnerAnalysis | null> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const experimentsCrud = new CrudOperations('ab_experiments', this.adminToken!);
      const variantsCrud = new CrudOperations('ab_experiment_variants', this.adminToken!);
      const metricsCrud = new CrudOperations('analytics_metrics', this.adminToken!);

      const experiment = await experimentsCrud.findById(experimentId);
      if (!experiment || experiment.status !== 'running') {
        return null;
      }

      const variants = await variantsCrud.findMany({ experiment_id: experimentId });
      if (variants.length < 2) {
        return null;
      }

      // Collect metrics for each variant
      const variantMetrics: ExperimentMetrics[] = [];

      for (const variant of variants) {
        const metrics = await metricsCrud.findMany({ post_id: variant.post_id });
        
        const impressions = metrics.filter(m => m.metric_type === 'views').reduce((sum, m) => sum + m.metric_value, 0);
        const clicks = metrics.filter(m => m.metric_type === 'clicks').reduce((sum, m) => sum + m.metric_value, 0);
        const likes = metrics.filter(m => m.metric_type === 'likes').reduce((sum, m) => sum + m.metric_value, 0);
        const shares = metrics.filter(m => m.metric_type === 'shares').reduce((sum, m) => sum + m.metric_value, 0);
        const comments = metrics.filter(m => m.metric_type === 'comments').reduce((sum, m) => sum + m.metric_value, 0);

        const engagementRate = impressions > 0 ? ((likes + shares + comments) / impressions) * 100 : 0;
        const conversionRate = impressions > 0 ? (clicks / impressions) * 100 : 0;

        variantMetrics.push({
          variantId: variant.id,
          impressions,
          clicks,
          conversions: clicks, // Simplified - clicks as conversions
          engagementRate,
          conversionRate,
          confidenceInterval: this.calculateConfidenceInterval(impressions, clicks)
        });
      }

      // Determine winner using statistical significance
      return this.determineWinner(variantMetrics, experiment);

    } catch (error) {
      console.error('Error analyzing A/B experiment:', error);
      return null;
    }
  }

  private determineWinner(
    variantMetrics: ExperimentMetrics[],
    experiment: any
  ): WinnerAnalysis {
    // Sort by engagement rate
    const sortedVariants = [...variantMetrics].sort((a, b) => b.engagementRate - a.engagementRate);
    const winner = sortedVariants[0];
    const runnerUp = sortedVariants[1];

    if (!winner || !runnerUp) {
      return {
        winnerVariantId: winner?.variantId || 0,
        confidence: 0,
        improvement: 0,
        significanceLevel: 0,
        recommendPromotion: false,
        reason: 'Insufficient data for analysis'
      };
    }

    // Calculate statistical significance
    const improvement = ((winner.engagementRate - runnerUp.engagementRate) / runnerUp.engagementRate) * 100;
    const significance = this.calculateStatisticalSignificance(winner, runnerUp);
    const confidence = Math.min(95, significance * 100);

    // Minimum requirements for promotion
    const minImprovement = 10; // 10% improvement
    const minConfidence = 80; // 80% confidence
    const minSampleSize = 50; // 50 impressions per variant

    const hasMinSample = winner.impressions >= minSampleSize && runnerUp.impressions >= minSampleSize;
    const hasSignificantImprovement = improvement >= minImprovement;
    const hasHighConfidence = confidence >= minConfidence;

    const recommendPromotion = hasMinSample && hasSignificantImprovement && hasHighConfidence;

    let reason = '';
    if (!hasMinSample) {
      reason = `Need more data (${Math.max(winner.impressions, runnerUp.impressions)}/${minSampleSize} impressions)`;
    } else if (!hasSignificantImprovement) {
      reason = `Improvement too small (${improvement.toFixed(1)}% < ${minImprovement}%)`;
    } else if (!hasHighConfidence) {
      reason = `Confidence too low (${confidence.toFixed(1)}% < ${minConfidence}%)`;
    } else {
      reason = `Clear winner with ${improvement.toFixed(1)}% improvement at ${confidence.toFixed(1)}% confidence`;
    }

    return {
      winnerVariantId: winner.variantId,
      confidence: Math.round(confidence),
      improvement: Math.round(improvement),
      significanceLevel: Math.round(significance * 100),
      recommendPromotion,
      reason
    };
  }

  private calculateConfidenceInterval(impressions: number, conversions: number): number {
    if (impressions === 0) return 0;
    
    const rate = conversions / impressions;
    const standardError = Math.sqrt((rate * (1 - rate)) / impressions);
    
    // 95% confidence interval
    return 1.96 * standardError;
  }

  private calculateStatisticalSignificance(variant1: ExperimentMetrics, variant2: ExperimentMetrics): number {
    // Simplified z-test for proportions
    const p1 = variant1.clicks / variant1.impressions;
    const p2 = variant2.clicks / variant2.impressions;
    
    if (variant1.impressions === 0 || variant2.impressions === 0) return 0;

    const pooledP = (variant1.clicks + variant2.clicks) / (variant1.impressions + variant2.impressions);
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1/variant1.impressions + 1/variant2.impressions));
    
    if (standardError === 0) return 0;

    const zScore = Math.abs(p1 - p2) / standardError;
    
    // Convert z-score to confidence level (simplified)
    if (zScore >= 2.58) return 0.99; // 99% confidence
    if (zScore >= 1.96) return 0.95; // 95% confidence
    if (zScore >= 1.65) return 0.90; // 90% confidence
    if (zScore >= 1.28) return 0.80; // 80% confidence
    
    return Math.max(0.5, zScore / 2.58); // Scaled confidence
  }

  async promoteWinner(
    experimentId: number,
    winnerVariantId: number,
    userId: number
  ): Promise<{ success: boolean; templateId?: number; message: string }> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const experimentsCrud = new CrudOperations('ab_experiments', this.adminToken!);
      const variantsCrud = new CrudOperations('ab_experiment_variants', this.adminToken!);
      const postsCrud = new CrudOperations('posts', this.adminToken!);
      const templatesCrud = new CrudOperations('content_templates', this.adminToken!);

      // Get experiment and winner variant
      const experiment = await experimentsCrud.findById(experimentId);
      const winnerVariant = await variantsCrud.findById(winnerVariantId);
      
      if (!experiment || !winnerVariant) {
        return { success: false, message: 'Experiment or variant not found' };
      }

      // Get the winning post
      const winnerPost = await postsCrud.findById(winnerVariant.post_id);
      if (!winnerPost) {
        return { success: false, message: 'Winner post not found' };
      }

      // Update experiment status
      await experimentsCrud.update(experimentId, {
        status: 'completed',
        winner_variant_id: winnerVariantId,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Create template from winning content
      const template = await templatesCrud.create({
        user_id: userId,
        name: `${experiment.name} - Winner`,
        description: `Winning variant from A/B test "${experiment.name}" with ${winnerVariant.performance_score}% performance score`,
        template_content: winnerPost.content,
        template_type: 'general',
        platform_specific: {
          ab_test_winner: true,
          experiment_id: experimentId,
          variant_id: winnerVariantId,
          performance_score: winnerVariant.performance_score,
          original_title: winnerPost.title
        },
        usage_count: 0,
        is_favorite: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update future draft posts to use winning approach
      await this.applyWinnerToFutureDrafts(userId, winnerPost, experiment);

      return {
        success: true,
        templateId: template.id,
        message: `Winner promoted successfully! Template "${template.name}" created and will influence future drafts.`
      };

    } catch (error) {
      console.error('Error promoting A/B test winner:', error);
      return {
        success: false,
        message: `Failed to promote winner: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async applyWinnerToFutureDrafts(userId: number, winnerPost: any, experiment: any): Promise<void> {
    try {
      const postsCrud = new CrudOperations('posts', this.adminToken!);
      
      // Get user's draft posts
      const drafts = await postsCrud.findMany({ user_id: userId, status: 'draft' });
      
      // Apply winning patterns to similar drafts
      for (const draft of drafts) {
        const similarity = this.calculateContentSimilarity(draft.content, winnerPost.content);
        
        if (similarity > 0.3) { // 30% similarity threshold
          // Update draft with winning elements
          const updatedMetadata = {
            ...draft.metadata,
            ab_influenced: true,
            winning_experiment: experiment.id,
            applied_patterns: this.extractWinningPatterns(winnerPost)
          };

          await postsCrud.update(draft.id, {
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.warn('Failed to apply winner to future drafts:', error);
    }
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple word overlap calculation
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private extractWinningPatterns(winnerPost: any): Record<string, any> {
    return {
      content_length: winnerPost.content.length,
      has_title: !!winnerPost.title,
      title_length: winnerPost.title?.length || 0,
      tag_count: winnerPost.tags?.length || 0,
      has_call_to_action: /\b(click|visit|check|try|get|download|sign up|join|follow)\b/i.test(winnerPost.content),
      has_question: /\?/.test(winnerPost.content),
      has_emoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(winnerPost.content)
    };
  }
}

// Global A/B experiment engine instance
let abExperimentEngine: ABExperimentEngine | null = null;

export async function getABExperimentEngine(): Promise<ABExperimentEngine> {
  if (!abExperimentEngine) {
    abExperimentEngine = new ABExperimentEngine();
    await abExperimentEngine.initialize();
  }
  return abExperimentEngine;
}
