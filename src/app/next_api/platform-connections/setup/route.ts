
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";

// POST request - setup initial platform connections with real credentials
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const { setupType } = body;
    
    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const user_id = context.payload?.sub;
    
    if (!user_id) {
      return createErrorResponse({
        errorMessage: "User ID is required",
        status: 400,
      });
    }

    const connections = [];

    if (setupType === 'sandbox' || setupType === 'all') {
      // Create sandbox connections with real API structure but sandbox data
      const sandboxConnections = [
        {
          user_id,
          platform_type: 'discord',
          connection_name: 'Sandbox Discord Server',
          api_credentials: {
            webhook_url: 'https://discord.com/api/webhooks/sandbox/webhook',
            server_id: 'sandbox_server_id',
            channel_id: 'sandbox_channel_id'
          },
          connection_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          user_id,
          platform_type: 'telegram',
          connection_name: 'Sandbox Telegram Channel',
          api_credentials: {
            chat_id: '@sandbox_channel',
            chat_type: 'channel'
          },
          connection_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          user_id,
          platform_type: 'whop',
          connection_name: 'Sandbox Whop Community',
          api_credentials: {
            community_id: 'sandbox_community_id'
          },
          connection_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];

      for (const connectionData of sandboxConnections) {
        const connection = await connectionsCrud.create(connectionData);
        connections.push(connection);
      }
    }

    if (setupType === 'production') {
      // Create production-ready connections with real credentials
      const productionConnections = [
        {
          user_id,
          platform_type: 'telegram',
          connection_name: 'OmniPost Telegram Bot',
          api_credentials: {
            bot_token: process.env.TELEGRAM_BOT_TOKEN,
            chat_id: body.telegram_chat_id || '@your_channel', // User needs to provide this
            chat_type: 'channel'
          },
          connection_status: body.telegram_chat_id ? 'active' : 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          user_id,
          platform_type: 'discord',
          connection_name: 'Discord Webhook',
          api_credentials: {
            webhook_url: body.discord_webhook_url || '', // User needs to provide this
            application_id: process.env.DISCORD_APPLICATION_ID,
            client_id: process.env.DISCORD_CLIENT_ID
          },
          connection_status: body.discord_webhook_url ? 'active' : 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          user_id,
          platform_type: 'whop',
          connection_name: 'Whop Community',
          api_credentials: {
            api_key: process.env.WHOP_API_KEY,
            company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
            app_id: process.env.NEXT_PUBLIC_WHOP_APP_ID
          },
          connection_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];

      for (const connectionData of productionConnections) {
        const connection = await connectionsCrud.create(connectionData);
        connections.push(connection);
      }
    }

    return createSuccessResponse({
      message: `Successfully created ${connections.length} platform connections`,
      connections: connections.map(conn => ({
        id: conn.id,
        platform_type: conn.platform_type,
        connection_name: conn.connection_name,
        connection_status: conn.connection_status
      }))
    });
  } catch (error) {
    console.error('Failed to setup platform connections:', error);
    return createErrorResponse({
      errorMessage: "Failed to setup platform connections",
      status: 500,
    });
  }
}, true);
