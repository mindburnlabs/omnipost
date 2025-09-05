
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';
import { z } from 'zod';

const analyzeImageSchema = z.object({
  image: z.string().min(1, 'Base64 encoded image is required'),
  prompt: z.string().optional(),
});

// POST request - analyze image with AI
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = analyzeImageSchema.parse(body);
    
    const aiService = await getAIService();
    
    const analysis = await aiService.analyzeImage(
      validatedData.image,
      validatedData.prompt
    );
    
    return createSuccessResponse({
      analysis,
      prompt: validatedData.prompt || 'Default image analysis'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('AI image analysis error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Image analysis failed",
      status: 500,
    });
  }
}, true);
