
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';
import { z } from 'zod';

const hashtagsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  count: z.number().min(1).max(20).optional().default(5),
});

// POST request - generate hashtags for content
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = hashtagsSchema.parse(body);
    
    const aiService = await getAIService();
    
    const hashtags = await aiService.generateHashtags(
      validatedData.content,
      validatedData.count
    );
    
    return createSuccessResponse({
      content: validatedData.content,
      hashtags,
      count: hashtags.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('AI hashtag generation error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Hashtag generation failed",
      status: 500,
    });
  }
}, true);
