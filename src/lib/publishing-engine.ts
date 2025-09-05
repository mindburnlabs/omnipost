
// Core publishing engine with enhanced scheduling, retries, and error handling
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';
import { publishToAllPlatforms } from './platform-integrations';
import { PlatformConnection, Post } from '@/types/omnipost';
import { getNotificationService } from './notification-service';
import { getPublishingQueue } from './publishing-queue';

export interface PublishJob {
  id: string;
  postId: number;
  userId: number;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  retryCount: number;
  maxRetries: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PublishingEngine {
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

    // Process jobs every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processScheduledPosts();
    }, 30000);

    // Process immediately on start
    this.processScheduledPosts();
  }

  async processScheduledPosts() {
    if (this.isProcessing || !this.adminToken) {
      return;
    }

    this.isProcessing = true;

    try {
      const postsCrud = new CrudOperations('posts'); // Use service role key only
      const connectionsCrud = new CrudOperations('platform_connections');
      const postPlatformsCrud = new CrudOperations('post_platforms');
      const activitiesCrud = new CrudOperations('user_activities');

      // Find posts that are scheduled and due for publishing
      const now = new Date();
      const scheduledPosts = await postsCrud.findMany(
        { status: 'scheduled' },
        {
          orderBy: { column: 'scheduled_at', direction: 'asc' }
        }
      );

      const duePosts = scheduledPosts.filter(post => 
        post.scheduled_at && new Date(post.scheduled_at) <= now
      );

      console.log(`Processing ${duePosts.length} due posts`);

      for (const post of duePosts) {
        await this.publishPost(post, {
          postsCrud,
          connectionsCrud,
          postPlatformsCrud,
          activitiesCrud
        });
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async publishPost(
    post: Post,
    cruds: {
      postsCrud: CrudOperations;
      connectionsCrud: CrudOperations;
      postPlatformsCrud: CrudOperations;
      activitiesCrud: CrudOperations;
    }
  ) {
    const { postsCrud, connectionsCrud, postPlatformsCrud, activitiesCrud } = cruds;

    try {
      console.log(`Publishing post ${post.id}: ${post.title || post.content.substring(0, 50)}...`);

      // Update post status to processing
      await postsCrud.update(post.id, {
        status: 'publishing',
        updated_at: new Date().toISOString()
      });

      // Get platform connections for this post
      const selectedPlatformIdsUnknown = (post.metadata as Record<string, unknown> | undefined)?.platforms as unknown;
      const selectedPlatformIds: number[] = Array.isArray(selectedPlatformIdsUnknown)
        ? (selectedPlatformIdsUnknown as unknown[]).filter((id): id is number => typeof id === 'number')
        : [];
      if (selectedPlatformIds.length === 0) {
        throw new Error('No platforms selected for this post');
      }

      const connections: PlatformConnection[] = [];
      for (const platformId of selectedPlatformIds) {
        const connection = await connectionsCrud.findById(platformId);
        if (connection && connection.connection_status === 'active') {
          connections.push(connection);
        }
      }

      if (connections.length === 0) {
        throw new Error('No active platform connections found');
      }

      // Publish to all platforms with enhanced error handling
      const publishResults = await publishToAllPlatforms(
        connections,
        post.content,
        post.title,
        post.metadata
      );

      let hasErrors = false;
      const platformResults = [];

      // Process results and create post_platforms records
      for (const { connectionId, result } of publishResults) {
        const postPlatformData = {
          user_id: post.user_id,
          post_id: post.id,
          platform_connection_id: connectionId,
          publish_status: result.success ? 'published' : 'failed',
          platform_post_id: result.platformPostId,
          error_message: result.error,
          published_at: result.success ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await postPlatformsCrud.create(postPlatformData);
        platformResults.push({ connectionId, success: result.success, error: result.error });

        if (!result.success) {
          hasErrors = true;
        }
      }

      // Update post status based on results
      const finalStatus = hasErrors ? 'failed' : 'published';
      const updateData: any = {
        status: finalStatus,
        updated_at: new Date().toISOString()
      };

      if (!hasErrors) {
        updateData.published_at = new Date().toISOString();
      }

      await postsCrud.update(post.id, updateData);

      // Log activity with detailed results
      await activitiesCrud.create({
        user_id: post.user_id,
        activity_type: hasErrors ? 'post_failed' : 'post_published',
        activity_description: hasErrors 
          ? `Failed to publish post "${post.title || 'Untitled'}" to some platforms`
          : `Successfully published post "${post.title || 'Untitled'}" to ${connections.length} platform${connections.length !== 1 ? 's' : ''}`,
        related_entity_type: 'post',
        related_entity_id: post.id,
        metadata: {
          platforms: platformResults,
          scheduled_at: post.scheduled_at,
          published_at: updateData.published_at,
          success_count: platformResults.filter(r => r.success).length,
          failure_count: platformResults.filter(r => !r.success).length
        },
        created_at: new Date().toISOString()
      });

      // Send notifications
      const notificationService = await getNotificationService();
      if (hasErrors) {
        const errorMessages = platformResults
          .filter(r => !r.success)
          .map(r => r.error)
          .join(', ');
        await notificationService.notifyPostFailed(post.user_id, post.title || 'Untitled', errorMessages);
      } else {
        await notificationService.notifyPostPublished(post.user_id, post.title || 'Untitled', connections.length);
      }

      console.log(`Post ${post.id} ${hasErrors ? 'partially failed' : 'published successfully'}`);

    } catch (error) {
      console.error(`Error publishing post ${post.id}:`, error);

      // Update post status to failed
      await postsCrud.update(post.id, {
        status: 'failed',
        updated_at: new Date().toISOString()
      });

      // Log failure activity
      await activitiesCrud.create({
        user_id: post.user_id,
        activity_type: 'post_failed',
        activity_description: `Failed to publish post "${post.title || 'Untitled'}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        related_entity_type: 'post',
        related_entity_id: post.id,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          scheduled_at: post.scheduled_at,
          retry_available: true
        },
        created_at: new Date().toISOString()
      });

      // Send failure notification
      const notificationService = await getNotificationService();
      await notificationService.notifyPostFailed(
        post.user_id, 
        post.title || 'Untitled', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async schedulePost(postId: number, scheduledAt: Date): Promise<string> {
    if (!this.adminToken) {
      throw new Error('Publishing engine not initialized');
    }

    const postsCrud = new CrudOperations('posts'); // Use service role key only
    
    // Update post in database
    await postsCrud.update(postId, {
      scheduled_at: scheduledAt.toISOString(),
      status: 'scheduled',
      updated_at: new Date().toISOString()
    });

    // Add to publishing queue
    const queue = await getPublishingQueue();
    const post = await postsCrud.findById(postId);
    const jobId = await queue.addJob(postId, post.user_id, scheduledAt);

    console.log(`Post ${postId} scheduled for ${scheduledAt.toISOString()} with job ${jobId}`);
    return jobId;
  }

  async publishNow(postId: number): Promise<string> {
    if (!this.adminToken) {
      throw new Error('Publishing engine not initialized');
    }

    const postsCrud = new CrudOperations('posts'); // Use service role key only
    
    // Set scheduled time to now to trigger immediate processing
    const now = new Date();
    await postsCrud.update(postId, {
      scheduled_at: now.toISOString(),
      status: 'scheduled',
      updated_at: new Date().toISOString()
    });

    // Add to publishing queue for immediate processing
    const queue = await getPublishingQueue();
    const post = await postsCrud.findById(postId);
    const jobId = await queue.addJob(postId, post.user_id, now);

    // Process immediately
    setTimeout(() => {
      this.processScheduledPosts();
    }, 1000);

    console.log(`Post ${postId} queued for immediate publishing with job ${jobId}`);
    return jobId;
  }

  async retryFailedPost(postId: number): Promise<string> {
    if (!this.adminToken) {
      throw new Error('Publishing engine not initialized');
    }

    const postsCrud = new CrudOperations('posts'); // Use service role key only
    
    // Reset post status and schedule for immediate retry
    const now = new Date();
    await postsCrud.update(postId, {
      status: 'scheduled',
      scheduled_at: now.toISOString(),
      updated_at: new Date().toISOString()
    });

    // Add to publishing queue
    const queue = await getPublishingQueue();
    const post = await postsCrud.findById(postId);
    const jobId = await queue.addJob(postId, post.user_id, now);

    // Process immediately
    setTimeout(() => {
      this.processScheduledPosts();
    }, 1000);

    console.log(`Post ${postId} queued for retry with job ${jobId}`);
    return jobId;
  }

  async getPublishingStats() {
    const queue = await getPublishingQueue();
    return queue.getQueueStats();
  }

  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }
}

// Global publishing engine instance
let publishingEngine: PublishingEngine | null = null;

export async function getPublishingEngine(): Promise<PublishingEngine> {
  if (!publishingEngine) {
    publishingEngine = new PublishingEngine();
    await publishingEngine.initialize();
  }
  return publishingEngine;
}

// Initialize publishing engine on server start only if database is configured
if (typeof window === 'undefined') {
  // Check if required environment variables are set before attempting to initialize
  const hasRequiredEnvVars = process.env.POSTGREST_URL && process.env.POSTGREST_SCHEMA && process.env.POSTGREST_API_KEY;
  
  if (hasRequiredEnvVars) {
    getPublishingEngine().catch(error => {
      console.error('Failed to initialize publishing engine:', error);
      console.log('Publishing engine will be initialized on demand when database is available.');
    });
  } else {
    console.log('PostgREST environment variables not configured. Publishing engine will initialize on demand.');
  }
}
