
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { getPublishingQueue } from '@/lib/publishing-queue';

// GET request - publishing queue statistics
export const GET = requestMiddleware(async (request, context) => {
  try {
    const queue = await getPublishingQueue();
    const stats = queue.getQueueStats();
    
    return createSuccessResponse({
      queue: stats,
      timestamp: new Date().toISOString(),
      healthy: stats.failed < 10 && stats.retrying < 5 // Simple health heuristic
    });
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return createErrorResponse({
      errorMessage: "Failed to get queue statistics",
      status: 500,
    });
  }
}, true);
