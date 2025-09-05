
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET request - fetch A/B experiments
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    const experimentsCrud = new CrudOperations("ab_experiments", context.token);
    
    const filters: Record<string, any> = {
      user_id: context.payload?.sub
    };
    
    if (status) {
      filters.status = status;
    }
    
    const data = await experimentsCrud.findMany(filters, { 
      limit: limit || 50, 
      offset: offset || 0,
      orderBy: {
        column: 'created_at',
        direction: 'desc'
      }
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Failed to fetch A/B experiments:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch A/B experiments",
      status: 500,
    });
  }
}, true);

// POST request - create A/B experiment
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.variants || body.variants.length < 2) {
      return createErrorResponse({
        errorMessage: "Name and at least 2 variants are required",
        status: 400,
      });
    }
    
    const experimentsCrud = new CrudOperations("ab_experiments", context.token);
    const variantsCrud = new CrudOperations("ab_experiment_variants", context.token);
    const user_id = context.payload?.sub;
    
    // Create experiment
    const experimentData = {
      user_id,
      name: body.name,
      description: body.description,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const experiment = await experimentsCrud.create(experimentData);
    
    // Create variants
    const variants = [];
    for (const variantData of body.variants) {
      const variant = await variantsCrud.create({
        user_id,
        experiment_id: experiment.id,
        post_id: variantData.post_id,
        variant_name: variantData.name,
        traffic_percentage: variantData.traffic_percentage || 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      variants.push(variant);
    }
    
    return createSuccessResponse({
      experiment,
      variants
    }, 201);
  } catch (error) {
    console.error('Failed to create A/B experiment:', error);
    return createErrorResponse({
      errorMessage: "Failed to create A/B experiment",
      status: 500,
    });
  }
}, true);
