
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";

// POST request - reset demo workspace
export const POST = requestMiddleware(async (request, context) => {
  try {
    const user_id = context.payload?.sub;
    
    if (!user_id) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    // Initialize CRUD operations
    const workspacesCrud = new CrudOperations("workspaces", context.token);
    const postsCrud = new CrudOperations("posts", context.token);
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const activitiesCrud = new CrudOperations("user_activities", context.token);
    const notificationsCrud = new CrudOperations("user_notifications", context.token);

    // Find sandbox workspace
    const sandboxWorkspaces = await workspacesCrud.findMany({ 
      user_id, 
      is_demo: true 
    });

    if (sandboxWorkspaces.length === 0) {
      return createErrorResponse({
        errorMessage: "No sandbox workspace found",
        status: 404,
      });
    }

    const sandboxWorkspace = sandboxWorkspaces[0];

    // Clear sandbox data
    const userPosts = await postsCrud.findMany({ user_id });
    for (const post of userPosts) {
      if (post.metadata?.sandbox || post.tags?.includes('sandbox')) {
        await postsCrud.delete(post.id);
      }
    }

    const userConnections = await connectionsCrud.findMany({ user_id });
    for (const connection of userConnections) {
      if (connection.connection_name.includes('Sandbox')) {
        await connectionsCrud.delete(connection.id);
      }
    }

    // Clear sandbox activities
    const userActivities = await activitiesCrud.findMany({ user_id });
    for (const activity of userActivities) {
      if (activity.metadata?.sandbox) {
        await activitiesCrud.delete(activity.id);
      }
    }

    // Clear sandbox notifications
    const userNotifications = await notificationsCrud.findMany({ user_id });
    for (const notification of userNotifications) {
      if (notification.data?.sandbox) {
        await notificationsCrud.delete(notification.id);
      }
    }

    // Log reset activity
    await activitiesCrud.create({
      user_id,
      activity_type: 'workspace_reset',
      activity_description: 'Sandbox workspace reset completed',
      metadata: {
        sandbox: true,
        reset_timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });

    return createSuccessResponse({
      message: 'Sandbox workspace reset successfully',
      workspace_id: sandboxWorkspace.id,
      reset_timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to reset sandbox workspace:', error);
    return createErrorResponse({
      errorMessage: "Failed to reset sandbox workspace",
      status: 500,
    });
  }
}, true);
