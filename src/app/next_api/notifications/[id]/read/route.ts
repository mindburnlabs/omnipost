
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { NextRequest } from 'next/server';
import { getNotificationService } from '@/lib/notification-service';

// PUT request - mark notification as read
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.indexOf('notifications') + 1];
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "Notification ID is required",
        status: 400,
      });
    }

    const userId = parseInt(context.payload?.sub || '0');
    if (!userId) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const notificationService = await getNotificationService();
    await notificationService.markAsRead(parseInt(id), userId);
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return createErrorResponse({
      errorMessage: "Failed to mark notification as read",
      status: 500,
    });
  }
}, true);
