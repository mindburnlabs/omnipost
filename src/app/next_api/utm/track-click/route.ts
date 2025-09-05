
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody, getRequestIp } from "@/lib/api-utils";
import { getAnalyticsEngine } from '@/lib/analytics-engine';
import { z } from 'zod';

const trackClickSchema = z.object({
  post_id: z.number().min(1, 'Post ID is required'),
  utm_campaign: z.string().min(1, 'UTM campaign is required'),
  utm_source: z.string().min(1, 'UTM source is required'),
  utm_medium: z.string().min(1, 'UTM medium is required'),
  utm_term: z.string().optional(),
  utm_content: z.string().optional()
});

// POST request - track UTM click
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = trackClickSchema.parse(body);
    
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = getRequestIp(request);

    const analyticsEngine = await getAnalyticsEngine();
    await analyticsEngine.trackUTMClick(
      validatedData.post_id,
      {
        campaign: validatedData.utm_campaign,
        source: validatedData.utm_source,
        medium: validatedData.utm_medium,
        term: validatedData.utm_term,
        content: validatedData.utm_content
      },
      userAgent,
      ipAddress
    );
    
    return createSuccessResponse({
      message: 'Click tracked successfully',
      post_id: validatedData.post_id,
      tracked_at: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('UTM click tracking error:', error);
    return createErrorResponse({
      errorMessage: "Failed to track click",
      status: 500,
    });
  }
}, false); // No auth required for click tracking
