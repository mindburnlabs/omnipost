
// Enhanced platform integration utilities for Discord, Telegram, and Whop
import { PlatformConnection } from '@/types/omnipost';
import CrudOperations from './crud-operations';
import { generateAdminUserToken } from './auth';

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
  metadata?: Record<string, any>;
  retryable?: boolean;
}

export interface PlatformPublisher {
  publish(content: string, title?: string, metadata?: Record<string, any>): Promise<PublishResult>;
  validate(content: string, title?: string): Promise<{ valid: boolean; errors: string[] }>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}

class DiscordPublisher implements PlatformPublisher {
  constructor(private connection: PlatformConnection) {}

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const webhookUrl = this.connection.api_credentials.webhook_url;
      if (!webhookUrl) {
        return { success: false, message: 'Discord webhook URL not configured' };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🔧 OmniPost connection test - this message confirms your Discord integration is working!',
          username: 'OmniPost Bot'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          message: `Discord webhook test failed: ${response.status} ${response.statusText} - ${errorText}` 
        };
      }

      return { success: true, message: 'Discord connection test successful' };
    } catch (error) {
      return { 
        success: false, 
        message: `Discord connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async publish(content: string, title?: string, metadata?: Record<string, any>): Promise<PublishResult> {
    try {
      // Check if this is demo mode
      if (this.connection.connection_name.includes('Demo') || this.connection.api_credentials.demo) {
        return {
          success: true,
          platformPostId: `discord_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: { demo: true, timestamp: new Date().toISOString() }
        };
      }

      const webhookUrl = this.connection.api_credentials.webhook_url;
      if (!webhookUrl) {
        throw new Error('Discord webhook URL not configured');
      }

      const payload: any = {
        content: content,
        username: metadata?.username || 'OmniPost Bot',
        avatar_url: metadata?.avatar_url
      };

      if (title) {
        payload.embeds = [{
          title: title,
          description: content,
          color: 0x5865F2, // Discord blue
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Published via OmniPost'
          }
        }];
        payload.content = ''; // Use embed instead of content when title is provided
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isRetryable = response.status >= 500 || response.status === 429;
        
        throw new Error(`Discord API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Store the message ID for idempotency
      const adminToken = await generateAdminUserToken();
      const postPlatformsCrud = new CrudOperations('post_platforms', adminToken);
      
      const messageId = `discord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        platformPostId: messageId,
        metadata: {
          webhook_url: webhookUrl.split('/').slice(-2).join('/'), // Last 2 parts for logging
          published_at: new Date().toISOString(),
          response_status: response.status
        }
      };
    } catch (error) {
      const isRetryable = error instanceof Error && 
        (error.message.includes('timeout') || error.message.includes('500') || error.message.includes('429'));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Discord error',
        retryable: isRetryable,
        metadata: {
          connection_name: this.connection.connection_name,
          platform_type: 'discord',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async validate(content: string, title?: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!content.trim() && !title?.trim()) {
      errors.push('Content or title is required');
    }
    
    if (content.length > 2000) {
      errors.push('Content exceeds Discord limit of 2000 characters');
    }
    
    if (title && title.length > 256) {
      errors.push('Title exceeds Discord embed limit of 256 characters');
    }

    // Check for Discord-specific formatting
    const discordMentions = content.match(/<@[!&]?\d+>/g) || [];
    if (discordMentions.length > 10) {
      errors.push('Too many Discord mentions (limit: 10)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

class TelegramPublisher implements PlatformPublisher {
  constructor(private connection: PlatformConnection) {}

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = this.connection.api_credentials.chat_id;
      
      if (!botToken) {
        return { success: false, message: 'Telegram bot token not configured in environment' };
      }
      
      if (!chatId) {
        return { success: false, message: 'Telegram chat ID not configured for this connection' };
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🔧 *OmniPost connection test*\n\nThis message confirms your Telegram integration is working correctly\\!',
          parse_mode: 'MarkdownV2'
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        return { 
          success: false, 
          message: `Telegram API error: ${result.description}` 
        };
      }

      return { success: true, message: 'Telegram connection test successful' };
    } catch (error) {
      return { 
        success: false, 
        message: `Telegram connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async publish(content: string, title?: string, metadata?: Record<string, any>): Promise<PublishResult> {
    try {
      // Check if this is demo mode
      if (this.connection.connection_name.includes('Demo') || this.connection.api_credentials.demo) {
        return {
          success: true,
          platformPostId: `telegram_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: { demo: true, timestamp: new Date().toISOString() }
        };
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = this.connection.api_credentials.chat_id;
      
      if (!botToken) {
        throw new Error('Telegram bot token not configured in environment');
      }
      
      if (!chatId) {
        throw new Error('Telegram chat ID not configured for this connection');
      }

      let message = content;
      if (title) {
        // Escape special characters for MarkdownV2
        const escapedTitle = title.replace(/[*_`[\]()~>#+=|{}.!-]/g, '\\$&');
        message = `*${escapedTitle}*\n\n${content}`;
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: metadata?.disable_preview || false
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        const isRetryable = result.error_code === 429 || // Rate limited
                           result.error_code >= 500; // Server errors
        
        const error = new Error(`Telegram API error: ${result.description}`);
        return {
          success: false,
          error: error.message,
          retryable: isRetryable,
          metadata: {
            error_code: result.error_code,
            connection_name: this.connection.connection_name,
            platform_type: 'telegram'
          }
        };
      }

      return {
        success: true,
        platformPostId: `telegram_${result.result.message_id}`,
        metadata: {
          chat_id: chatId,
          message_id: result.result.message_id,
          published_at: new Date().toISOString()
        }
      };
    } catch (error) {
      const isRetryable = error instanceof Error && 
        (error.message.includes('timeout') || error.message.includes('ECONNRESET'));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Telegram error',
        retryable: isRetryable,
        metadata: {
          connection_name: this.connection.connection_name,
          platform_type: 'telegram',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async validate(content: string, title?: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!content.trim() && !title?.trim()) {
      errors.push('Content or title is required');
    }
    
    const totalLength = (title || '').length + content.length;
    if (totalLength > 4096) {
      errors.push('Total content exceeds Telegram limit of 4096 characters');
    }

    // Check for Telegram-specific formatting issues
    const unescapedChars = content.match(/[*_`[\]()~>#+=|{}.!-]/g) || [];
    if (unescapedChars.length > 0) {
      errors.push('Content contains special characters that may need escaping for Telegram');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

class WhopPublisher implements PlatformPublisher {
  constructor(private connection: PlatformConnection) {}

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = process.env.WHOP_API_KEY;
      const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
      
      if (!apiKey) {
        return { success: false, message: 'Whop API key not configured in environment' };
      }
      
      if (!companyId) {
        return { success: false, message: 'Whop company ID not configured in environment' };
      }

      // Test by fetching company info
      const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          message: `Whop API error: ${response.status} ${response.statusText} - ${errorText}` 
        };
      }

      const companyData = await response.json();
      return { 
        success: true, 
        message: `Whop connection test successful - Connected to ${companyData.name}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Whop connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async publish(content: string, title?: string, metadata?: Record<string, any>): Promise<PublishResult> {
    try {
      // Check if this is demo mode
      if (this.connection.connection_name.includes('Demo') || this.connection.api_credentials.demo) {
        return {
          success: true,
          platformPostId: `whop_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: { demo: true, timestamp: new Date().toISOString() }
        };
      }

      const apiKey = process.env.WHOP_API_KEY;
      const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
      
      if (!apiKey) {
        throw new Error('Whop API key not configured in environment');
      }
      
      if (!companyId) {
        throw new Error('Whop company ID not configured in environment');
      }

      const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || 'Community Update',
          content: content,
          published: true,
          tags: metadata?.tags || []
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isRetryable = response.status >= 500 || response.status === 429;
        
        throw new Error(`Whop API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      return {
        success: true,
        platformPostId: `whop_${result.id}`,
        metadata: {
          company_id: companyId,
          post_id: result.id,
          published_at: new Date().toISOString()
        }
      };
    } catch (error) {
      const isRetryable = error instanceof Error && 
        (error.message.includes('timeout') || error.message.includes('500') || error.message.includes('429'));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Whop error',
        retryable: isRetryable,
        metadata: {
          connection_name: this.connection.connection_name,
          platform_type: 'whop',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async validate(content: string, title?: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!content.trim()) {
      errors.push('Content is required');
    }
    
    if (content.length > 10000) {
      errors.push('Content exceeds Whop limit of 10000 characters');
    }
    
    if (title && title.length > 200) {
      errors.push('Title exceeds Whop limit of 200 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export function createPlatformPublisher(connection: PlatformConnection): PlatformPublisher {
  switch (connection.platform_type) {
    case 'discord':
      return new DiscordPublisher(connection);
    case 'telegram':
      return new TelegramPublisher(connection);
    case 'whop':
      return new WhopPublisher(connection);
    default:
      throw new Error(`Unsupported platform type: ${connection.platform_type}`);
  }
}

export async function publishToAllPlatforms(
  connections: PlatformConnection[],
  content: string,
  title?: string,
  metadata?: Record<string, any>
): Promise<Array<{ connectionId: number; result: PublishResult }>> {
  const results = await Promise.allSettled(
    connections.map(async (connection) => {
      const publisher = createPlatformPublisher(connection);
      const result = await publisher.publish(content, title, metadata);
      
      // Store platform post ID for idempotency
      if (result.success && result.platformPostId) {
        try {
          const adminToken = await generateAdminUserToken();
          const postPlatformsCrud = new CrudOperations('post_platforms', adminToken);
          
          // Check if already exists to prevent duplicates
          const existing = await postPlatformsCrud.findMany({
            platform_connection_id: connection.id,
            platform_post_id: result.platformPostId
          });

          if (existing.length === 0) {
            await postPlatformsCrud.create({
              user_id: connection.user_id,
              post_id: metadata?.post_id || 0,
              platform_connection_id: connection.id,
              platform_post_id: result.platformPostId,
              publish_status: 'published',
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } catch (dbError) {
          console.warn('Failed to store platform post ID:', dbError);
        }
      }

      return {
        connectionId: connection.id,
        result
      };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        connectionId: connections[index].id,
        result: {
          success: false,
          error: `Publishing failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
          retryable: true
        }
      };
    }
  });
}

export async function validateForAllPlatforms(
  connections: PlatformConnection[],
  content: string,
  title?: string
): Promise<Array<{ connectionId: number; validation: { valid: boolean; errors: string[] } }>> {
  const validations = await Promise.allSettled(
    connections.map(async (connection) => {
      const publisher = createPlatformPublisher(connection);
      const validation = await publisher.validate(content, title);
      return {
        connectionId: connection.id,
        validation
      };
    })
  );

  return validations.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        connectionId: connections[index].id,
        validation: {
          valid: false,
          errors: [`Validation failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`]
        }
      };
    }
  });
}

export async function testAllConnections(
  connections: PlatformConnection[]
): Promise<Array<{ connectionId: number; result: { success: boolean; message: string } }>> {
  const results = await Promise.allSettled(
    connections.map(async (connection) => {
      const publisher = createPlatformPublisher(connection);
      const result = await publisher.testConnection();
      return {
        connectionId: connection.id,
        result
      };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        connectionId: connections[index].id,
        result: {
          success: false,
          message: `Connection test failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`
        }
      };
    }
  });
}
