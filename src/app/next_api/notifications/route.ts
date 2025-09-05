
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams } from "@/lib/api-utils";
import { getNotificationService } from '@/lib/notification-service';

// GET request - fetch user notifications
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit } = parseQueryParams(request);
    const userId = parseInt(context.payload?.sub || '0');
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const notificationService = await getNotificationService();
    const notifications = await notificationService.getNotificationsForUser(userId, limit || 20);
    
    return createSuccessResponse(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch notifications",
      status: 500,
    });
  }
}, true);
