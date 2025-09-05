
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';
import { z } from 'zod';

const abVariantsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  count: z.number().min(1).max(5).optional().default(2),
});

// POST request - generate A/B test variants
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = abVariantsSchema.parse(body);
    
    const aiService = await getAIService();
    
    const variants = await aiService.generateABTestVariants(
      validatedData.content,
      validatedData.count
    );
    
    return createSuccessResponse({
      originalContent: validatedData.content,
      variants,
      count: variants.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('AI A/B variants error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "A/B variants generation failed",
      status: 500,
    });
  }
}, true);
