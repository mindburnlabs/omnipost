
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";
import { getAnalyticsEngine } from '@/lib/analytics-engine';

// GET request - fetch engagement trends
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit } = parseQueryParams(request);
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const userId = parseInt(context.payload?.sub || '0');
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const analyticsEngine = await getAnalyticsEngine();
    const trends = await analyticsEngine.getEngagementTrends(userId, days);
    
    return createSuccessResponse(trends);
  } catch (error) {
    console.error('Failed to fetch engagement trends:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch engagement trends",
      status: 500,
    });
  }
}, true);
