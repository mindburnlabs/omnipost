
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// POST request - promote A/B test winner
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

    const body = await validateRequestBody(request);
    const { winner_variant_id } = body;
    
    if (!winner_variant_id) {
      return createErrorResponse({
        errorMessage: "Winner variant ID is required",
        status: 400,
      });
    }
    
    const experimentsCrud = new CrudOperations("ab_experiments", context.token);
    const variantsCrud = new CrudOperations("ab_experiment_variants", context.token);
    const postsCrud = new CrudOperations("posts", context.token);
    const contentTemplatesCrud = new CrudOperations("content_templates", context.token);
    
    // Check if experiment exists and user owns it
    const experiment = await experimentsCrud.findById(experimentId);
    if (!experiment) {
      return createErrorResponse({
        errorMessage: "Experiment not found",
        status: 404,
      });
    }
    
    if (experiment.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Access denied",
        status: 403,
      });
    }

    // Get the winning variant
    const winnerVariant = await variantsCrud.findById(winner_variant_id);
    if (!winnerVariant || winnerVariant.experiment_id !== parseInt(experimentId)) {
      return createErrorResponse({
        errorMessage: "Invalid winner variant",
        status: 400,
      });
    }

    // Get the winning post
    const winnerPost = await postsCrud.findById(winnerVariant.post_id);
    if (!winnerPost) {
      return createErrorResponse({
        errorMessage: "Winner post not found",
        status: 404,
      });
    }

    // Update experiment with winner
    await experimentsCrud.update(experimentId, {
      winner_variant_id,
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Create a content template from the winning content for future use
    const contentTemplateData = {
      user_id: experiment.user_id,
      name: `${experiment.name} - Winner`,
      description: `Winning variant from A/B test "${experiment.name}" with ${winnerVariant.performance_score}% performance score`,
      template_content: winnerPost.content,
      template_type: 'general',
      platform_specific: {
        ab_test_winner: true,
        experiment_id: experimentId,
        variant_id: winnerVariant.id,
        performance_score: winnerVariant.performance_score,
        original_title: winnerPost.title
      },
      usage_count: 0,
      is_favorite: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const createdContentTemplate = await contentTemplatesCrud.create(contentTemplateData);

    return createSuccessResponse({
      message: 'Winner promoted successfully',
      experiment: {
        id: experiment.id,
        name: experiment.name,
        winner_variant_id,
        status: 'completed'
      },
      winner_post: {
        id: winnerPost.id,
        title: winnerPost.title,
        content: winnerPost.content
      },
      created_template: {
        id: createdContentTemplate.id,
        name: createdContentTemplate.name
      }
    });
  } catch (error) {
    console.error('Failed to promote A/B test winner:', error);
    return createErrorResponse({
      errorMessage: "Failed to promote A/B test winner",
      status: 500,
    });
  }
}, true);
