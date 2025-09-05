
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getRepostGuard } from '@/lib/repost-guard';
import { z } from 'zod';

const checkDuplicatesSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  title: z.string().optional(),
  exclude_post_id: z.number().optional()
});

// POST request - check for duplicate content
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = checkDuplicatesSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const repostGuard = await getRepostGuard();
    const result = await repostGuard.checkForDuplicates(
      userId,
      validatedData.content,
      validatedData.title,
      validatedData.exclude_post_id
    );
    
    return createSuccessResponse(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('Repost guard check error:', error);
    return createErrorResponse({
      errorMessage: "Failed to check for duplicates",
      status: 500,
    });
  }
}, true);
