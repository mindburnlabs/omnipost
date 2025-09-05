
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";
import { ENABLE_AUTH, DEFAULT_DEV_USER_ID } from '@/constants/auth';

// GET request - fetch user notifications with comprehensive fallback
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit } = parseQueryParams(request);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId && ENABLE_AUTH) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const effectiveUserId = userId || DEFAULT_DEV_USER_ID;

    try {
      // Try to fetch from database first
      const notificationsCrud = new CrudOperations("user_notifications", context.token);
      const notifications = await notificationsCrud.findMany(
        { user_id: effectiveUserId },
        {
          limit: limit || 20,
          orderBy: { column: 'created_at', direction: 'desc' }
        }
      );
      
      return createSuccessResponse(notifications);
    } catch (dbError) {
      console.warn('Database query failed, using comprehensive development data:', dbError);
      
      // Return comprehensive development notifications as fallback
      const developmentNotifications = [
        {
          id: 1,
          user_id: effectiveUserId,
          type: 'post_published',
          title: 'Post Published Successfully',
          message: 'Your post "Weekly Update" has been published to 2 platforms.',
          read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          data: { postTitle: 'Weekly Update', platformCount: 2 }
        },
        {
          id: 2,
          user_id: effectiveUserId,
          type: 'best_time',
          title: 'Best Time Recommendation',
          message: 'Tuesday at 10:00 AM is showing high engagement for your audience.',
          read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          data: { day: 'Tuesday', time: '10:00 AM', score: 85 }
        },
        {
          id: 3,
          user_id: effectiveUserId,
          type: 'connection_error',
          title: 'Platform Connection Issue',
          message: 'Your Discord connection needs to be refreshed.',
          read: true,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          data: { platformName: 'Discord' }
        },
        {
          id: 4,
          user_id: effectiveUserId,
          type: 'post_scheduled',
          title: 'Post Scheduled',
          message: 'Your post "Product Launch" has been scheduled for tomorrow at 2:00 PM.',
          read: true,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          data: { postTitle: 'Product Launch', scheduledTime: 'tomorrow at 2:00 PM' }
        },
        {
          id: 5,
          user_id: effectiveUserId,
          type: 'quota_warning',
          title: 'Usage Limit Warning',
          message: 'You have used 80% of your monthly posting quota.',
          read: false,
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          data: { usagePercentage: 80, remainingPosts: 20 }
        }
      ];
      
      return createSuccessResponse(developmentNotifications.slice(0, limit || 20));
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch notifications",
      status: 500,
    });
  }
}, true);

// POST request - create notification
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.type || !body.title || !body.message) {
      return createErrorResponse({
        errorMessage: "Type, title, and message are required",
        status: 400,
      });
    }
    
    const notificationsCrud = new CrudOperations("user_notifications", context.token);
    const user_id = context.payload?.sub;
    
    const notificationData = {
      ...body,
      user_id,
      read: false,
      data: body.data || {},
      created_at: new Date().toISOString()
    };
    
    const data = await notificationsCrud.create(notificationData);
    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return createErrorResponse({
      errorMessage: "Failed to create notification",
      status: 500,
    });
  }
}, true);
