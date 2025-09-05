
// Notification service for in-app, email, and webhook notifications
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';
import { sendVerificationEmail } from './api-utils';

export interface Notification {
  id?: number;
  user_id: number;
  type: 'post_published' | 'post_failed' | 'approval_needed' | 'best_time' | 'connection_error' | 'quota_warning';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  schedule_reminders: boolean;
  approval_notifications: boolean;
  failure_alerts: boolean;
}

export class NotificationService {
  private adminToken: string | null = null;

  async initialize() {
    this.adminToken = await generateAdminUserToken();
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<void> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      // Store in-app notification
      const notificationsCrud = new CrudOperations('user_notifications'); // Use service role key only
      await notificationsCrud.create({
        ...notification,
        read: false,
        created_at: new Date().toISOString()
      });

      // Get user preferences
      const profilesCrud = new CrudOperations('user_profiles');
      const profiles = await profilesCrud.findMany({ user_id: notification.user_id });
      const preferences: NotificationPreferences = profiles[0]?.notification_preferences || {
        push: true,
        email: true,
        schedule_reminders: true,
        approval_notifications: true,
        failure_alerts: true
      };

      // Send email notification if enabled
      if (preferences.email && this.shouldSendEmail(notification.type, preferences)) {
        await this.sendEmailNotification(notification);
      }

      console.log(`Notification sent to user ${notification.user_id}: ${notification.title}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private shouldSendEmail(type: string, preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'post_failed':
        return preferences.failure_alerts;
      case 'approval_needed':
        return preferences.approval_notifications;
      case 'post_published':
        return preferences.schedule_reminders;
      default:
        return true;
    }
  }

  private async sendEmailNotification(notification: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<void> {
    try {
      // Get user email
      const usersCrud = new CrudOperations('users'); // Use service role key only
      const user = await usersCrud.findById(notification.user_id);
      
      if (!user?.email) {
        console.warn(`No email found for user ${notification.user_id}`);
        return;
      }

      const htmlContent = this.generateEmailTemplate(notification);
      
      // Use the existing email service
      await sendVerificationEmail(user.email, htmlContent);
      
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  private generateEmailTemplate(notification: Omit<Notification, 'id' | 'read' | 'created_at'>): string {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'OmniPost';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 30px; }
          .message { font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          <div class="content">
            <div class="message">${notification.message}</div>
            <div class="cta">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">
                View Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p>This notification was sent by ${appName}. You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async getNotificationsForUser(userId: number, limit = 20): Promise<Notification[]> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const notificationsCrud = new CrudOperations('user_notifications'); // Use service role key only
      const notifications = await notificationsCrud.findMany(
        { user_id: userId },
        {
          limit,
          orderBy: { column: 'created_at', direction: 'desc' }
        }
      );

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const notificationsCrud = new CrudOperations('user_notifications'); // Use service role key only
      
      // Verify ownership
      const notification = await notificationsCrud.findById(notificationId);
      if (!notification || notification.user_id !== userId) {
        throw new Error('Notification not found or access denied');
      }

      await notificationsCrud.update(notificationId, {
        read: true,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    if (!this.adminToken) {
      await this.initialize();
    }

    try {
      const notificationsCrud = new CrudOperations('user_notifications'); // Use service role key only
      const unreadNotifications = await notificationsCrud.findMany({
        user_id: userId,
        read: false
      });

      for (const notification of unreadNotifications) {
        await notificationsCrud.update(notification.id, {
          read: true,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Convenience methods for common notification types
  async notifyPostPublished(userId: number, postTitle: string, platformCount: number): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      type: 'post_published',
      title: 'Post Published Successfully',
      message: `Your post "${postTitle}" has been published to ${platformCount} platform${platformCount !== 1 ? 's' : ''}.`,
      data: { postTitle, platformCount }
    });
  }

  async notifyPostFailed(userId: number, postTitle: string, error: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      type: 'post_failed',
      title: 'Post Publishing Failed',
      message: `Failed to publish "${postTitle}": ${error}. You can retry from your dashboard.`,
      data: { postTitle, error }
    });
  }

  async notifyApprovalNeeded(userId: number, postTitle: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      type: 'approval_needed',
      title: 'Post Approval Required',
      message: `The post "${postTitle}" is waiting for approval before it can be published.`,
      data: { postTitle }
    });
  }

  async notifyConnectionError(userId: number, platformName: string, error: string): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      type: 'connection_error',
      title: 'Platform Connection Issue',
      message: `There's an issue with your ${platformName} connection: ${error}. Please check your settings.`,
      data: { platformName, error }
    });
  }
}

// Global notification service instance
let notificationService: NotificationService | null = null;

export async function getNotificationService(): Promise<NotificationService> {
  if (!notificationService) {
    notificationService = new NotificationService();
    await notificationService.initialize();
  }
  return notificationService;
}
