
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';
import { z } from 'zod';

const optimizeSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  platform: z.enum(['discord', 'telegram', 'whop']),
});

// POST request - optimize content for specific platform
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = optimizeSchema.parse(body);
    
    const aiService = await getAIService();
    
    const optimizedContent = await aiService.optimizeForPlatform(
      validatedData.content,
      validatedData.platform
    );
    
    return createSuccessResponse({
      originalContent: validatedData.content,
      optimizedContent,
      platform: validatedData.platform
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('AI optimization error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Content optimization failed",
      status: 500,
    });
  }
}, true);
