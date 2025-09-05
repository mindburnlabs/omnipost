
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import { DEFAULT_DEV_USER_ID } from '@/constants/auth';

// GET request - fallback for when user_notifications table doesn't exist
export const GET = requestMiddleware(async (request, context) => {
  try {
    const userId = parseInt(context.payload?.sub || DEFAULT_DEV_USER_ID.toString());
    
    // Return comprehensive development notifications
    const developmentNotifications = [
      {
        id: 1,
        user_id: userId,
        type: 'welcome',
        title: 'Welcome to OmniPost!',
        message: 'Your account has been set up successfully. Start by connecting your first platform.',
        read: false,
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        data: { isWelcome: true }
      },
      {
        id: 2,
        user_id: userId,
        type: 'setup_reminder',
        title: 'Complete Your Setup',
        message: 'Connect Discord, Telegram, or Whop to start publishing content.',
        read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        data: { setupStep: 'platform_connections' }
      },
      {
        id: 3,
        user_id: userId,
        type: 'best_time',
        title: 'Best Time Recommendation',
        message: 'Based on industry data, Tuesday at 10:00 AM shows high engagement.',
        read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        data: { day: 'Tuesday', time: '10:00 AM', score: 85 }
      }
    ];
    
    return createSuccessResponse(developmentNotifications);
  } catch (error) {
    console.error('Failed to provide fallback notifications:', error);
    return createErrorResponse({
      errorMessage: "Failed to fetch notifications",
      status: 500,
    });
  }
}, true);
