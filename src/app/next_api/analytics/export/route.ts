
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAnalyticsEngine } from '@/lib/analytics-engine';
import { z } from 'zod';

const exportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  format: z.enum(['csv', 'json']).default('csv')
});

// POST request - export analytics data
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = exportSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const startDate = new Date(validatedData.start_date);
    const endDate = new Date(validatedData.end_date);

    if (startDate >= endDate) {
      return createErrorResponse({
        errorMessage: "Start date must be before end date",
        status: 400,
      });
    }

    const analyticsEngine = await getAnalyticsEngine();
    const exportData = await analyticsEngine.exportAnalyticsData(userId, startDate, endDate, validatedData.format);
    
    if (validatedData.format === 'csv') {
      const csvContent = await analyticsEngine.generateCSVExport(exportData);
      
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="omnipost-analytics-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      return createSuccessResponse(exportData);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Analytics export error:', error);
    return createErrorResponse({
      errorMessage: "Failed to export analytics data",
      status: 500,
    });
  }
}, true);
