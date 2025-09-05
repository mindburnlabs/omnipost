
// Enhanced publishing queue with retry logic and error handling
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';
import { publishToAllPlatforms } from './platform-integrations';
import { getNotificationService } from './notification-service';
import { PlatformConnection, Post } from '@/types/omnipost';

export interface QueueJob {
  id: string;
  postId: number;
  userId: number;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  retryCount: number;
  maxRetries: number;
  error?: string;
  platformResults?: Array<{
    connectionId: number;
    success: boolean;
    platformPostId?: string;
    error?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class PublishingQueue {
  private adminToken: string | null = null;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private queue: Map<string, QueueJob> = new Map();

  async initialize() {
    this.adminToken = await generateAdminUserToken();
    this.startProcessing();
  }

  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process jobs every 15 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 15000);

    // Process immediately on start
    this.processQueue();
  }

  async addJob(postId: number, userId: number, scheduledAt: Date): Promise<string> {
    const jobId = `job_${postId}_${Date.now()}`;
    const job: QueueJob = {
      id: jobId,
      postId,
      userId,
      scheduledAt,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.queue.set(jobId, job);
    console.log(`Added job ${jobId} for post ${postId} scheduled at ${scheduledAt.toISOString()}`);
    
    return jobId;
  }

  async processQueue() {
    if (this.isProcessing || !this.adminToken) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      const dueJobs = Array.from(this.queue.values()).filter(job => 
        (job.status === 'pending' || job.status === 'retrying') && 
        job.scheduledAt <= now
      );

      console.log(`Processing ${dueJobs.length} due jobs`);

      for (const job of dueJobs) {
        await this.processJob(job);
      }

      // Also check database for scheduled posts
      await this.syncWithDatabase();
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async syncWithDatabase() {
    try {
      const postsCrud = new CrudOperations('posts', this.adminToken!);
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

      for (const post of duePosts) {
        // Check if already in queue
        const existingJob = Array.from(this.queue.values()).find(job => job.postId === post.id);
        if (!existingJob) {
          await this.addJob(post.id, post.user_id, new Date(post.scheduled_at));
        }
      }
    } catch (error) {
      console.error('Error syncing with database:', error);
    }
  }

  private async processJob(job: QueueJob) {
    try {
      console.log(`Processing job ${job.id} for post ${job.postId}`);
      
      // Update job status
      job.status = 'processing';
      job.updatedAt = new Date();
      this.queue.set(job.id, job);

      const postsCrud = new CrudOperations('posts', this.adminToken!);
      const connectionsCrud = new CrudOperations('platform_connections', this.adminToken!);
      const postPlatformsCrud = new CrudOperations('post_platforms', this.adminToken!);
      const activitiesCrud = new CrudOperations('user_activities', this.adminToken!);

      // Get post data
      const post = await postsCrud.findById(job.postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Update post status to publishing
      await postsCrud.update(post.id, {
        status: 'publishing',
        updated_at: new Date().toISOString()
      });

      // Get platform connections
      const selectedPlatformIds = post.metadata?.platforms || [];
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
        platformResults.push({ 
          connectionId, 
          success: result.success, 
          platformPostId: result.platformPostId,
          error: result.error 
        });

        if (!result.success) {
          hasErrors = true;
        }
      }

      // Update job with results
      job.platformResults = platformResults;

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

      // Log activity
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
          job_id: job.id
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

      // Mark job as completed
      job.status = hasErrors ? 'failed' : 'completed';
      job.updatedAt = new Date();
      this.queue.set(job.id, job);

      console.log(`Job ${job.id} ${hasErrors ? 'completed with errors' : 'completed successfully'}`);

    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      
      job.retryCount++;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.updatedAt = new Date();

      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed';
        
        // Update post status to failed
        try {
          const postsCrud = new CrudOperations('posts', this.adminToken!);
          await postsCrud.update(job.postId, {
            status: 'failed',
            updated_at: new Date().toISOString()
          });

          // Send failure notification
          const notificationService = await getNotificationService();
          await notificationService.notifyPostFailed(
            job.userId, 
            'Post', 
            `Max retries exceeded: ${job.error}`
          );
        } catch (updateError) {
          console.error('Failed to update post status:', updateError);
        }
      } else {
        job.status = 'retrying';
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, job.retryCount) * 60000; // 1min, 2min, 4min
        job.scheduledAt = new Date(Date.now() + retryDelay);
        console.log(`Job ${job.id} will retry in ${retryDelay / 1000} seconds`);
      }

      this.queue.set(job.id, job);
    }
  }

  async retryJob(jobId: string): Promise<boolean> {
    const job = this.queue.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'failed' && job.retryCount < job.maxRetries) {
      job.status = 'retrying';
      job.scheduledAt = new Date(); // Retry immediately
      job.updatedAt = new Date();
      this.queue.set(jobId, job);
      
      // Trigger immediate processing
      setTimeout(() => this.processQueue(), 1000);
      return true;
    }

    return false;
  }

  getJobStatus(jobId: string): QueueJob | null {
    return this.queue.get(jobId) || null;
  }

  getQueueStats() {
    const jobs = Array.from(this.queue.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      retrying: jobs.filter(j => j.status === 'retrying').length
    };
  }

  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }
}

// Global publishing queue instance
let publishingQueue: PublishingQueue | null = null;

export async function getPublishingQueue(): Promise<PublishingQueue> {
  if (!publishingQueue) {
    publishingQueue = new PublishingQueue();
    await publishingQueue.initialize();
  }
  return publishingQueue;
}

// Initialize publishing queue on server start only if database is configured
if (typeof window === 'undefined') {
  // Check if required environment variables are set before attempting to initialize
  const hasRequiredEnvVars = process.env.POSTGREST_URL && process.env.POSTGREST_SCHEMA && process.env.POSTGREST_API_KEY;
  
  if (hasRequiredEnvVars) {
    getPublishingQueue().catch(error => {
      console.error('Failed to initialize publishing queue:', error);
      console.log('Publishing queue will be initialized on demand when database is available.');
    });
  } else {
    console.log('PostgREST environment variables not configured. Publishing queue will initialize on demand.');
  }
}
