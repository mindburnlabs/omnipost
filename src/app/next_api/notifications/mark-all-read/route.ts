
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { getNotificationService } from '@/lib/notification-service';

// PUT request - mark all notifications as read
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const userId = parseInt(context.payload?.sub || '0');
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const notificationService = await getNotificationService();
    await notificationService.markAllAsRead(userId);
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return createErrorResponse({
      errorMessage: "Failed to mark all notifications as read",
      status: 500,
    });
  }
}, true);
