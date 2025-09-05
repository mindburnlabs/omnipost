
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";
import { getAnalyticsEngine } from '@/lib/analytics-engine';

// GET request - fetch real dashboard analytics data
export const GET = requestMiddleware(async (request, context) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const platformType = url.searchParams.get('platform_type');
    
    const userId = parseInt(context.payload?.sub || '0');
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analyticsEngine = await getAnalyticsEngine();
    const dashboardData = await analyticsEngine.getAnalyticsData(userId, start, end, platformType || undefined);
    
    return createSuccessResponse(dashboardData);
  } catch (error) {
    console.error('Failed to fetch dashboard analytics:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch dashboard analytics",
      status: 500,
    });
  }
}, true);
