
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getAutomationEngine } from '@/lib/automation-engine';

// GET request - get automation rule run history
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const ruleId = pathSegments[pathSegments.indexOf('automation-rules') + 1];
    
    if (!ruleId) {
      return createErrorResponse({
        errorMessage: "Rule ID is required",
        status: 400,
      });
    }

    const { limit } = parseQueryParams(request);
    const automationEngine = await getAutomationEngine();
    const history = await automationEngine.getRunHistory(parseInt(ruleId), limit || 20);
    
    return createSuccessResponse(history);
  } catch (error) {
    console.error('Failed to get automation rule history:', error);
    return createErrorResponse({
      errorMessage: "Failed to get automation rule history",
      status: 500,
    });
  }
}, true);
