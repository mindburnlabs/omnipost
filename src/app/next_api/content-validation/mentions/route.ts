
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { getMentionResolver } from '@/lib/mention-resolver';
import { z } from 'zod';

const resolveMentionsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  platform_type: z.enum(['discord', 'telegram', 'whop']),
  connection_id: z.number().min(1, 'Connection ID is required')
});

function generateMentionRecommendation(summary: any, mentions: any[], roles: any[]): string {
  const issues = [];
  
  if (summary.unresolvedMentions > 0) {
    issues.push(`${summary.unresolvedMentions} mention(s) could not be resolved`);
  }
  
  if (summary.invalidRoles > 0) {
    issues.push(`${summary.invalidRoles} role(s) may not exist`);
  }
  
  if (issues.length === 0) {
    return summary.totalMentions > 0 
      ? `All ${summary.totalMentions} mention(s) and ${summary.totalRoles} role(s) look good.`
      : 'No mentions or roles found in content.';
  }
  
  return `${issues.join(' and ')}. Please verify these exist in your target destination.`;
}

// POST request - resolve mentions and roles
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = resolveMentionsSchema.parse(body);
    
    const mentionResolver = await getMentionResolver();
    
    const [mentions, roles] = await Promise.all([
      mentionResolver.resolveMentions(
        validatedData.content,
        validatedData.platform_type,
        validatedData.connection_id
      ),
      mentionResolver.validateRoles(
        validatedData.content,
        validatedData.platform_type,
        validatedData.connection_id
      )
    ]);
    
    const summary = {
      totalMentions: mentions.length,
      resolvedMentions: mentions.filter(m => m.resolved).length,
      unresolvedMentions: mentions.filter(m => !m.resolved).length,
      totalRoles: roles.length,
      validRoles: roles.filter(r => r.exists).length,
      invalidRoles: roles.filter(r => !r.exists).length
    };
    
    return createSuccessResponse({
      summary,
      mentions,
      roles,
      recommendation: generateMentionRecommendation(summary, mentions, roles)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0]?.message || "Validation error",
        status: 400,
      });
    }
    
    console.error('Mention resolution error:', error);
    return createErrorResponse({
      errorMessage: "Failed to resolve mentions",
      status: 500,
    });
  }
}, true);
