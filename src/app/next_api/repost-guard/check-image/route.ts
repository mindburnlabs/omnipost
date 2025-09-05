
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getRepostGuard } from '@/lib/repost-guard';
import { z } from 'zod';

const checkImageDuplicatesSchema = z.object({
  image_url: z.string().url('Valid image URL is required'),
  exclude_post_id: z.number().optional()
});

// POST request - check for duplicate images
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = checkImageDuplicatesSchema.parse(body);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const repostGuard = await getRepostGuard();
    const result = await repostGuard.checkImageDuplicates(
      userId,
      validatedData.image_url,
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
    
    console.error('Image duplicate check error:', error);
    return createErrorResponse({
      errorMessage: "Failed to check for image duplicates",
      status: 500,
    });
  }
}, true);
