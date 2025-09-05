
import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { getNotificationService } from '@/lib/notification-service';

// POST request - handle Whop webhooks
export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    
    // Verify webhook signature (in production, you'd verify the Whop webhook signature)
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-whop-signature');
      if (!signature) {
        return createErrorResponse({
          errorMessage: "Missing webhook signature",
          status: 401,
        });
      }
      // In production, verify the signature here
    }

    const adminToken = await generateAdminUserToken();
    const usersCrud = new CrudOperations("users", adminToken);
    const activitiesCrud = new CrudOperations("user_activities", adminToken);
    const notificationService = await getNotificationService();

    // Handle different webhook events
    switch (body.type) {
      case 'user.subscription.created':
      case 'user.subscription.updated':
        await handleSubscriptionEvent(body, usersCrud, activitiesCrud, notificationService);
        break;
        
      case 'user.subscription.cancelled':
      case 'user.subscription.expired':
        await handleSubscriptionCancellation(body, usersCrud, activitiesCrud, notificationService);
        break;
        
      case 'payment.succeeded':
        await handlePaymentSuccess(body, usersCrud, activitiesCrud, notificationService);
        break;
        
      case 'payment.failed':
        await handlePaymentFailure(body, usersCrud, activitiesCrud, notificationService);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${body.type}`);
    }

    return createSuccessResponse({
      message: 'Webhook processed successfully',
      event_type: body.type,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return createErrorResponse({
      errorMessage: "Webhook processing failed",
      status: 500,
    });
  }
}, false); // No auth required for webhooks

async function handleSubscriptionEvent(
  event: any,
  usersCrud: CrudOperations,
  activitiesCrud: CrudOperations,
  notificationService: any
) {
  const { user, subscription } = event.data;
  
  try {
    // Find or create user
    let existingUsers = await usersCrud.findMany({ email: user.email });
    let dbUser = existingUsers[0];
    
    if (!dbUser) {
      // Create new user
      dbUser = await usersCrud.create({
        email: user.email,
        password: 'WHOP_USER', // Whop users don't need passwords
        role: 'app20250904195901yvsuhcayno_v1_user'
      });
    }

    // Log activity
    await activitiesCrud.create({
      user_id: dbUser.id,
      activity_type: 'subscription_updated',
      activity_description: `Subscription ${event.type.includes('created') ? 'created' : 'updated'} via Whop`,
      metadata: {
        whop_user_id: user.id,
        subscription_id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        webhook_event: event.type
      },
      created_at: new Date().toISOString()
    });

    // Send welcome notification for new subscriptions
    if (event.type === 'user.subscription.created') {
      await notificationService.sendNotification({
        user_id: dbUser.id,
        type: 'welcome',
        title: 'Welcome to OmniPost!',
        message: 'Your subscription is active. Start by connecting your first platform.',
        data: {
          subscription_plan: subscription.plan,
          whop_user_id: user.id
        }
      });
    }

    console.log(`Processed subscription event for user ${user.email}`);
  } catch (error) {
    console.error('Failed to handle subscription event:', error);
    throw error;
  }
}

async function handleSubscriptionCancellation(
  event: any,
  usersCrud: CrudOperations,
  activitiesCrud: CrudOperations,
  notificationService: any
) {
  const { user, subscription } = event.data;
  
  try {
    const existingUsers = await usersCrud.findMany({ email: user.email });
    const dbUser = existingUsers[0];
    
    if (dbUser) {
      // Log cancellation activity
      await activitiesCrud.create({
        user_id: dbUser.id,
        activity_type: 'subscription_cancelled',
        activity_description: `Subscription ${event.type.includes('cancelled') ? 'cancelled' : 'expired'} via Whop`,
        metadata: {
          whop_user_id: user.id,
          subscription_id: subscription.id,
          cancellation_reason: subscription.cancellation_reason,
          webhook_event: event.type
        },
        created_at: new Date().toISOString()
      });

      // Send notification about access changes
      await notificationService.sendNotification({
        user_id: dbUser.id,
        type: 'quota_warning',
        title: 'Subscription Status Changed',
        message: event.type.includes('cancelled') 
          ? 'Your subscription has been cancelled. Access will continue until the end of your billing period.'
          : 'Your subscription has expired. Please renew to continue using OmniPost.',
        data: {
          subscription_status: subscription.status,
          whop_user_id: user.id
        }
      });
    }

    console.log(`Processed subscription cancellation for user ${user.email}`);
  } catch (error) {
    console.error('Failed to handle subscription cancellation:', error);
    throw error;
  }
}

async function handlePaymentSuccess(
  event: any,
  usersCrud: CrudOperations,
  activitiesCrud: CrudOperations,
  notificationService: any
) {
  const { user, payment } = event.data;
  
  try {
    const existingUsers = await usersCrud.findMany({ email: user.email });
    const dbUser = existingUsers[0];
    
    if (dbUser) {
      // Log payment activity
      await activitiesCrud.create({
        user_id: dbUser.id,
        activity_type: 'payment_succeeded',
        activity_description: `Payment of $${payment.amount} processed successfully`,
        metadata: {
          whop_user_id: user.id,
          payment_id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          webhook_event: event.type
        },
        created_at: new Date().toISOString()
      });

      // Send payment confirmation
      await notificationService.sendNotification({
        user_id: dbUser.id,
        type: 'post_published', // Reusing existing type
        title: 'Payment Processed',
        message: `Your payment of $${payment.amount} has been processed successfully.`,
        data: {
          payment_amount: payment.amount,
          payment_id: payment.id,
          whop_user_id: user.id
        }
      });
    }

    console.log(`Processed payment success for user ${user.email}`);
  } catch (error) {
    console.error('Failed to handle payment success:', error);
    throw error;
  }
}

async function handlePaymentFailure(
  event: any,
  usersCrud: CrudOperations,
  activitiesCrud: CrudOperations,
  notificationService: any
) {
  const { user, payment } = event.data;
  
  try {
    const existingUsers = await usersCrud.findMany({ email: user.email });
    const dbUser = existingUsers[0];
    
    if (dbUser) {
      // Log payment failure
      await activitiesCrud.create({
        user_id: dbUser.id,
        activity_type: 'payment_failed',
        activity_description: `Payment of $${payment.amount} failed`,
        metadata: {
          whop_user_id: user.id,
          payment_id: payment.id,
          amount: payment.amount,
          failure_reason: payment.failure_reason,
          webhook_event: event.type
        },
        created_at: new Date().toISOString()
      });

      // Send payment failure notification
      await notificationService.sendNotification({
        user_id: dbUser.id,
        type: 'connection_error', // Reusing existing type
        title: 'Payment Failed',
        message: `Your payment of $${payment.amount} could not be processed. Please update your payment method.`,
        data: {
          payment_amount: payment.amount,
          payment_id: payment.id,
          failure_reason: payment.failure_reason,
          whop_user_id: user.id
        }
      });
    }

    console.log(`Processed payment failure for user ${user.email}`);
  } catch (error) {
    console.error('Failed to handle payment failure:', error);
    throw error;
  }
}
