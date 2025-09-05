
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';
import { z } from 'zod';

const ideasSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  platform: z.string().optional(),
  count: z.number().min(1).max(20).optional().default(5),
});

// POST request - generate content ideas
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = ideasSchema.parse(body);
    
    const aiService = await getAIService();
    
    const ideas = await aiService.generateContentIdeas(
      validatedData.topic,
      validatedData.platform,
      validatedData.count
    );
    
    return createSuccessResponse({
      topic: validatedData.topic,
      platform: validatedData.platform,
      ideas,
      count: ideas.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('AI content ideas error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "Content ideas generation failed",
      status: 500,
    });
  }
}, true);
