
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getAutomationEngine } from '@/lib/automation-engine';

// POST request - dry run automation rule
export const POST = requestMiddleware(async (request: NextRequest, context) => {
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

    const automationEngine = await getAutomationEngine();
    const dryRunResult = await automationEngine.dryRunRule(parseInt(ruleId));
    
    return createSuccessResponse(dryRunResult);
  } catch (error) {
    console.error('Failed to dry run automation rule:', error);
    return createErrorResponse({
      errorMessage: "Failed to dry run automation rule",
      status: 500,
    });
  }
}, true);
