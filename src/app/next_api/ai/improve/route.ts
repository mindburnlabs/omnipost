
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';
import { z } from 'zod';

const improveSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  instructions: z.string().optional(),
});

// POST request - improve content with AI using user configuration
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = improveSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    const aiService = await getAIService();
    
    const improvedContent = await aiService.improveContent(
      validatedData.content,
      validatedData.instructions,
      userId || undefined
    );
    
    return createSuccessResponse({
      originalContent: validatedData.content,
      improvedContent,
      instructions: validatedData.instructions
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('AI content improvement error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Content improvement failed",
      status: 500,
    });
  }
}, true);
