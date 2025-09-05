
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getBestTimeAnalyzer } from '@/lib/best-time-analyzer';
import { z } from 'zod';

const updateRecommendationsSchema = z.object({
  timezone: z.string().optional().default('UTC')
});

// POST request - update best time recommendations for user
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = updateRecommendationsSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const analyzer = await getBestTimeAnalyzer();
    await analyzer.updateRecommendationsForUser(userId, validatedData.timezone);
    
    return createSuccessResponse({
      message: 'Best time recommendations updated successfully',
      timezone: validatedData.timezone,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update recommendations:', error);
    return createErrorResponse({
      errorMessage: "Failed to update recommendations",
      status: 500,
    });
  }
}, true);
