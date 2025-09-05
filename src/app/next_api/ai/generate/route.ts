
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getAIService } from '@/lib/ai-service';
import { z } from 'zod';

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  alias: z.string().optional().default('default-writer'), // Use alias instead of provider
  maxTokens: z.number().min(1).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  image: z.string().optional() // Base64 encoded image
});

// POST request - generate AI content with alias-based routing
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = generateSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    const aiService = await getAIService();
    
    const response = await aiService.generateContent({
      prompt: validatedData.prompt,
      alias: validatedData.alias, // Use alias instead of provider
      maxTokens: validatedData.maxTokens,
      temperature: validatedData.temperature,
      image: validatedData.image,
      userId: userId || undefined,
      workspaceId: 1
    });
    
    return createSuccessResponse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('AI generation error:', error);
    return createErrorResponse({
      errorMessage: error instanceof Error ? error.message : "AI generation failed",
      status: 500,
    });
  }
}, true);
