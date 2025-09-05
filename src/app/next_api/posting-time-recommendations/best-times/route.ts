
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { getBestTimeAnalyzer } from '@/lib/best-time-analyzer';

// GET request - fetch real best posting times with timezone context
export const GET = requestMiddleware(async (request, context) => {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    const timezone = url.searchParams.get('timezone') || 'UTC';
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const analyzer = await getBestTimeAnalyzer();
    const recommendations = await analyzer.getBestTimesForUser(userId, platform || undefined, timezone);
    
    // Format for frontend consumption with timezone context
    const bestTimes = recommendations.slice(0, 5).map(rec => ({
      day: rec.day,
      time: rec.time,
      score: rec.score,
      confidence: rec.confidence,
      timezone: rec.timezone,
      localTime: rec.localTime,
      engagementData: rec.engagementData
    }));
    
    return createSuccessResponse(bestTimes);
  } catch (error) {
    console.error('Failed to fetch best posting times:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch best posting times",
      status: 500,
    });
  }
}, true);
