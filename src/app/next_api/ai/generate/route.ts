
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
    
    // Filter out undefined values for exactOptionalPropertyTypes
    const generateParams: any = {
      prompt: validatedData.prompt,
      alias: validatedData.alias,
      workspaceId: 1
    };
    
    if (validatedData.maxTokens !== undefined) {
      generateParams.maxTokens = validatedData.maxTokens;
    }
    if (validatedData.temperature !== undefined) {
      generateParams.temperature = validatedData.temperature;
    }
    if (validatedData.image !== undefined) {
      generateParams.image = validatedData.image;
    }
    if (userId > 0) {
      generateParams.userId = userId;
    }
    
    const response = await aiService.generateContent(generateParams);
    
    return createSuccessResponse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
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
