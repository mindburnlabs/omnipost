

import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import CrudOperations from '@/lib/crud-operations';

// POST request - add Discord webhook connection
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const { webhook_url, connection_name, server_name } = body;
    
    if (!webhook_url) {
      return createErrorResponse({
        errorMessage: "Discord webhook URL is required",
        status: 400,
      });
    }

    // Validate webhook URL format
    const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!webhookRegex.test(webhook_url)) {
      return createErrorResponse({
        errorMessage: "Invalid Discord webhook URL format",
        status: 400,
      });
    }

    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const user_id = context.payload?.sub;
    
    // Test the webhook first
    try {
      const testResponse = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '🎉 OmniPost connection test successful! Your Discord integration is ready.',
          username: 'OmniPost Bot'
        }),
      });

      if (!testResponse.ok) {
        throw new Error(`Webhook test failed: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      return createErrorResponse({
        errorMessage: `Failed to test Discord webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 400,
      });
    }

    const connectionData = {
      user_id,
      platform_type: 'discord',
      connection_name: connection_name || `Discord - ${server_name || 'Server'}`,
      api_credentials: {
        webhook_url,
        server_name: server_name || 'Unknown Server',
        application_id: process.env.DISCORD_APPLICATION_ID,
        client_id: process.env.DISCORD_CLIENT_ID
      },
      connection_status: 'active',
      last_sync_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const connection = await connectionsCrud.create(connectionData);
    
    return createSuccessResponse({
      message: 'Discord webhook connection created successfully',
      connection: {
        id: connection.id,
        platform_type: connection.platform_type,
        connection_name: connection.connection_name,
        connection_status: connection.connection_status
      }
    });
  } catch (error) {
    console.error('Failed to create Discord connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to create Discord connection",
      status: 500,
    });
  }
}, true);

