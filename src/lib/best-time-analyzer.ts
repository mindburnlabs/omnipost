
// Real best time analysis based on historical engagement data with timezone context
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';

export interface BestTimeRecommendation {
  day: string;
  time: string;
  dayOfWeek: number;
  hourOfDay: number;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  timezone: string;
  localTime: string;
  engagementData: {
    avgLikes: number;
    avgShares: number;
    avgComments: number;
    sampleSize: number;
  };
}

export class BestTimeAnalyzer {
  private adminToken: string | null = null;

  async initialize() {
    this.adminToken = await generateAdminUserToken();
  }

  async getBestTimesForUser(
    userId: number, 
    platformType?: string,
    userTimezone: string = 'UTC'
  ): Promise<BestTimeRecommendation[]> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const metricsCrud = new CrudOperations('analytics_metrics', this.adminToken!);
      const postsCrud = new CrudOperations('posts', this.adminToken!);
      const postPlatformsCrud = new CrudOperations('post_platforms', this.adminToken!);

      // Get user's published posts with engagement data
      const posts = await postsCrud.findMany(
        { user_id: userId, status: 'published' },
        { limit: 200, orderBy: { column: 'published_at', direction: 'desc' } }
      );

      if (posts.length < 10) {
        // Not enough data, return timezone-aware general best practices
        return this.getDefaultBestTimes(userTimezone);
      }

      // Collect engagement data by time slots
      const timeSlotData: Record<string, {
        totalEngagement: number;
        likes: number;
        shares: number;
        comments: number;
        postCount: number;
        posts: any[];
      }> = {};

      for (const post of posts) {
        if (!post.published_at) continue;

        const publishedAt = new Date(post.published_at);
        
        // Convert to user's timezone
        const userTime = new Date(publishedAt.toLocaleString("en-US", { timeZone: userTimezone }));
        const dayOfWeek = userTime.getDay();
        const hourOfDay = userTime.getHours();
        const slotKey = `${dayOfWeek}-${hourOfDay}`;

        // Get engagement metrics for this post
        const postMetrics = await metricsCrud.findMany({ post_id: post.id });
        
        const likes = postMetrics.filter(m => m.metric_type === 'likes').reduce((sum, m) => sum + m.metric_value, 0);
        const shares = postMetrics.filter(m => m.metric_type === 'shares').reduce((sum, m) => sum + m.metric_value, 0);
        const comments = postMetrics.filter(m => m.metric_type === 'comments').reduce((sum, m) => sum + m.metric_value, 0);
        const totalEngagement = likes + shares + comments;

        if (!timeSlotData[slotKey]) {
          timeSlotData[slotKey] = {
            totalEngagement: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            postCount: 0,
            posts: []
          };
        }

        timeSlotData[slotKey].totalEngagement += totalEngagement;
        timeSlotData[slotKey].likes += likes;
        timeSlotData[slotKey].shares += shares;
        timeSlotData[slotKey].comments += comments;
        timeSlotData[slotKey].postCount += 1;
        timeSlotData[slotKey].posts.push(post);
      }

      // Calculate average engagement per time slot
      const timeSlots = Object.entries(timeSlotData).map(([slotKey, data]) => {
        const [dayOfWeek, hourOfDay] = slotKey.split('-').map(Number);
        const avgEngagement = data.totalEngagement / data.postCount;
        
        return {
          dayOfWeek,
          hourOfDay,
          avgEngagement,
          avgLikes: data.likes / data.postCount,
          avgShares: data.shares / data.postCount,
          avgComments: data.comments / data.postCount,
          sampleSize: data.postCount,
          confidence: data.postCount >= 5 ? 'high' : data.postCount >= 3 ? 'medium' : 'low'
        };
      });

      // Sort by engagement and get top recommendations
      const topSlots = timeSlots
        .filter(slot => slot.sampleSize >= 2) // Minimum sample size
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 5);

      const recommendations: BestTimeRecommendation[] = topSlots.map(slot => {
        const utcTime = this.convertToUTC(slot.dayOfWeek, slot.hourOfDay, userTimezone);
        
        return {
          day: this.getDayName(slot.dayOfWeek),
          time: this.formatTime(slot.hourOfDay),
          dayOfWeek: slot.dayOfWeek,
          hourOfDay: slot.hourOfDay,
          score: Math.min(100, Math.round(slot.avgEngagement * 10)),
          confidence: slot.confidence as 'low' | 'medium' | 'high',
          timezone: userTimezone,
          localTime: `${this.getDayName(slot.dayOfWeek)} ${this.formatTime(slot.hourOfDay)} ${userTimezone}`,
          engagementData: {
            avgLikes: Math.round(slot.avgLikes),
            avgShares: Math.round(slot.avgShares),
            avgComments: Math.round(slot.avgComments),
            sampleSize: slot.sampleSize
          }
        };
      });

      return recommendations.length > 0 ? recommendations : this.getDefaultBestTimes(userTimezone);

    } catch (error) {
      console.error('Error analyzing best times:', error);
      return this.getDefaultBestTimes(userTimezone);
    }
  }

  private convertToUTC(dayOfWeek: number, hourOfDay: number, fromTimezone: string): { day: number; hour: number } {
    // Create a date in the user's timezone
    const now = new Date();
    const targetDate = new Date(now);
    
    // Set to the target day and hour
    const daysToAdd = (dayOfWeek - now.getDay() + 7) % 7;
    targetDate.setDate(now.getDate() + daysToAdd);
    targetDate.setHours(hourOfDay, 0, 0, 0);

    // Convert to UTC
    const utcDate = new Date(targetDate.toLocaleString("en-US", { timeZone: "UTC" }));
    
    return {
      day: utcDate.getDay(),
      hour: utcDate.getHours()
    };
  }

  private getDefaultBestTimes(userTimezone: string = 'UTC'): BestTimeRecommendation[] {
    // Industry best practices adjusted for user's timezone
    const defaultTimes = [
      { day: 2, hour: 10, score: 85 }, // Tuesday 10 AM
      { day: 4, hour: 14, score: 78 }, // Thursday 2 PM
      { day: 3, hour: 11, score: 72 }  // Wednesday 11:30 AM
    ];

    return defaultTimes.map(time => ({
      day: this.getDayName(time.day),
      time: this.formatTime(time.hour),
      dayOfWeek: time.day,
      hourOfDay: time.hour,
      score: time.score,
      confidence: 'medium' as const,
      timezone: userTimezone,
      localTime: `${this.getDayName(time.day)} ${this.formatTime(time.hour)} ${userTimezone}`,
      engagementData: {
        avgLikes: Math.round(time.score * 0.3),
        avgShares: Math.round(time.score * 0.1),
        avgComments: Math.round(time.score * 0.2),
        sampleSize: 0
      }
    }));
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  private formatTime(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }

  async updateRecommendationsForUser(userId: number, userTimezone: string = 'UTC'): Promise<void> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const recommendationsCrud = new CrudOperations('posting_time_recommendations', this.adminToken!);
      
      // Get fresh recommendations
      const recommendations = await this.getBestTimesForUser(userId, undefined, userTimezone);
      
      // Clear old recommendations
      const existing = await recommendationsCrud.findMany({ user_id: userId });
      for (const rec of existing) {
        await recommendationsCrud.delete(rec.id);
      }

      // Insert new recommendations
      for (const rec of recommendations) {
        await recommendationsCrud.create({
          user_id: userId,
          platform_type: 'general',
          day_of_week: rec.dayOfWeek,
          hour_of_day: rec.hourOfDay,
          engagement_score: rec.score,
          recommendation_strength: rec.confidence,
          last_calculated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      console.log(`Updated ${recommendations.length} recommendations for user ${userId} in ${userTimezone}`);
    } catch (error) {
      console.error('Error updating recommendations:', error);
    }
  }

  async getTimingHeatmapData(
    userId: number,
    platformType?: string,
    userTimezone: string = 'UTC'
  ): Promise<Array<{ day: number; hour: number; engagement: number; postCount: number }>> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const metricsCrud = new CrudOperations('analytics_metrics', this.adminToken!);
      const postsCrud = new CrudOperations('posts', this.adminToken!);

      const posts = await postsCrud.findMany(
        { user_id: userId, status: 'published' },
        { limit: 500, orderBy: { column: 'published_at', direction: 'desc' } }
      );

      const heatmapData: Record<string, { engagement: number; postCount: number }> = {};

      for (const post of posts) {
        if (!post.published_at) continue;

        const publishedAt = new Date(post.published_at);
        const userTime = new Date(publishedAt.toLocaleString("en-US", { timeZone: userTimezone }));
        const day = userTime.getDay();
        const hour = userTime.getHours();
        const key = `${day}-${hour}`;

        // Get engagement for this post
        const metrics = await metricsCrud.findMany({ post_id: post.id });
        const engagement = metrics.reduce((sum, m) => sum + m.metric_value, 0);

        if (!heatmapData[key]) {
          heatmapData[key] = { engagement: 0, postCount: 0 };
        }

        heatmapData[key].engagement += engagement;
        heatmapData[key].postCount += 1;
      }

      // Convert to array format
      const result = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const key = `${day}-${hour}`;
          const data = heatmapData[key] || { engagement: 0, postCount: 0 };
          const avgEngagement = data.postCount > 0 ? data.engagement / data.postCount : 0;

          result.push({
            day,
            hour,
            engagement: Math.round(avgEngagement),
            postCount: data.postCount
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error generating heatmap data:', error);
      return [];
    }
  }
}

// Global analyzer instance
let bestTimeAnalyzer: BestTimeAnalyzer | null = null;

export async function getBestTimeAnalyzer(): Promise<BestTimeAnalyzer> {
  if (!bestTimeAnalyzer) {
    bestTimeAnalyzer = new BestTimeAnalyzer();
    await bestTimeAnalyzer.initialize();
  }
  return bestTimeAnalyzer;
}
