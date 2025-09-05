
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getABExperimentEngine } from '@/lib/ab-experiment-engine';

// POST request - analyze A/B experiment for winner
export const POST = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const experimentId = pathSegments[pathSegments.indexOf('ab-experiments') + 1];
    
    if (!experimentId) {
      return createErrorResponse({
        errorMessage: "Experiment ID is required",
        status: 400,
      });
    }

    const abEngine = await getABExperimentEngine();
    const analysis = await abEngine.analyzeExperiment(parseInt(experimentId));
    
    if (!analysis) {
      return createErrorResponse({
        errorMessage: "Experiment not found or not ready for analysis",
        status: 404,
      });
    }
    
    return createSuccessResponse(analysis);
  } catch (error) {
    console.error('Failed to analyze A/B experiment:', error);
    return createErrorResponse({
      errorMessage: "Failed to analyze A/B experiment",
      status: 500,
    });
  }
}, true);
