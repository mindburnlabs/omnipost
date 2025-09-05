
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getLinkValidator } from '@/lib/link-validator';
import { z } from 'zod';

const validateLinksSchema = z.object({
  content: z.string().min(1, 'Content is required')
});

function generateLinkRecommendation(summary: any): string {
  if (summary.totalLinks === 0) {
    return 'No links found in content.';
  }
  
  if (summary.invalidLinks > 0) {
    return `${summary.invalidLinks} broken link(s) detected. Please fix or remove them before publishing.`;
  }
  
  if (summary.warningLinks > 0) {
    return `${summary.warningLinks} link(s) have warnings. Review for potential issues.`;
  }
  
  if (summary.timeoutLinks > 0) {
    return `${summary.timeoutLinks} link(s) timed out during validation. They may be slow to load.`;
  }
  
  return `All ${summary.validLinks} link(s) are valid and accessible.`;
}

// POST request - validate links in content
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = validateLinksSchema.parse(body);
    
    const linkValidator = await getLinkValidator();
    const results = await linkValidator.validateLinks(validatedData.content);
    
    const summary = {
      totalLinks: results.length,
      validLinks: results.filter(r => r.status === 'valid').length,
      invalidLinks: results.filter(r => r.status === 'invalid').length,
      warningLinks: results.filter(r => r.status === 'warning').length,
      timeoutLinks: results.filter(r => r.status === 'timeout').length
    };
    
    return createSuccessResponse({
      summary,
      results,
      recommendation: generateLinkRecommendation(summary)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('Link validation error:', error);
    return createErrorResponse({
      errorMessage: "Failed to validate links",
      status: 500,
    });
  }
}, true);
