

import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";
import CrudOperations from '@/lib/crud-operations';

// POST request - setup Telegram connection
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const { chat_id, connection_name, chat_type = 'channel' } = body;
    
    if (!chat_id) {
      return createErrorResponse({
        errorMessage: "Telegram chat ID or username is required",
        status: 400,
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return createErrorResponse({
        errorMessage: "Telegram bot token not configured",
        status: 500,
      });
    }

    const connectionsCrud = new CrudOperations("platform_connections", context.token);
    const user_id = context.payload?.sub;
    
    // Test the bot connection first
    try {
      const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chat_id,
          text: '🎉 *OmniPost connection test successful!*\n\nYour Telegram integration is ready to use.',
          parse_mode: 'Markdown'
        }),
      });

      const result = await testResponse.json();

      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }
    } catch (error) {
      return createErrorResponse({
        errorMessage: `Failed to test Telegram connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 400,
      });
    }

    const connectionData = {
      user_id,
      platform_type: 'telegram',
      connection_name: connection_name || `Telegram - ${chat_id}`,
      api_credentials: {
        chat_id,
        chat_type,
        bot_token: 'configured' // Don't store the actual token
      },
      connection_status: 'active',
      last_sync_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const connection = await connectionsCrud.create(connectionData);
    
    return createSuccessResponse({
      message: 'Telegram connection created successfully',
      connection: {
        id: connection.id,
        platform_type: connection.platform_type,
        connection_name: connection.connection_name,
        connection_status: connection.connection_status
      }
    });
  } catch (error) {
    console.error('Failed to create Telegram connection:', error);
    return createErrorResponse({
      errorMessage: "Failed to create Telegram connection",
      status: 500,
    });
  }
}, true);

