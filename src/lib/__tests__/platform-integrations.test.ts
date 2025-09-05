import { createPlatformPublisher } from '../platform-integrations';
import type { PlatformConnection } from '@/types/omnipost';

// Mock fetch globally for these tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Platform Integrations', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Clear environment variables
    delete process.env.DISCORD_CLIENT_SECRET;
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.WHOP_API_KEY;
  });

  describe('Discord Publisher', () => {
    const discordConnection: PlatformConnection = {
      id: 1,
      user_id: 1,
      platform_type: 'discord',
      connection_name: 'Test Discord',
      api_credentials: {
        webhook_url: 'https://discord.com/api/webhooks/test'
      },
      connection_status: 'active',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    it('should create Discord publisher', () => {
      const publisher = createPlatformPublisher(discordConnection);
      expect(publisher).toBeDefined();
    });

    it('should validate Discord content correctly', async () => {
      const publisher = createPlatformPublisher(discordConnection);
      
      // Valid content
      const validResult = await publisher.validate('Hello world!');
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Empty content
      const emptyResult = await publisher.validate('');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors).toContain('Content is required');

      // Too long content
      const longContent = 'a'.repeat(2001);
      const longResult = await publisher.validate(longContent);
      expect(longResult.valid).toBe(false);
      expect(longResult.errors).toContain('Content exceeds Discord limit of 2000 characters');
    });

    it('should publish to Discord successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123456789' })
      });

      const publisher = createPlatformPublisher(discordConnection);
      const result = await publisher.publish('Test message');

      expect(result.success).toBe(true);
      expect(result.platformPostId).toBe('discord_123456789');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test message' })
        })
      );
    });

    it('should handle Discord API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid webhook URL'
      });

      const publisher = createPlatformPublisher(discordConnection);
      const result = await publisher.publish('Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Discord webhook error: 400 Bad Request');
    });

    it('should handle demo mode', async () => {
      const demoConnection = {
        ...discordConnection,
        connection_name: 'Demo Discord',
        api_credentials: { ...discordConnection.api_credentials, demo: true }
      };

      const publisher = createPlatformPublisher(demoConnection);
      const result = await publisher.publish('Test message');

      expect(result.success).toBe(true);
      expect(result.platformPostId).toMatch(/^discord_demo_/);
      expect(result.metadata?.demo).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Telegram Publisher', () => {
    const telegramConnection: PlatformConnection = {
      id: 2,
      user_id: 2,
      platform_type: 'telegram',
      connection_name: 'Test Telegram',
      api_credentials: {
        chat_id: '@testchannel'
      },
      connection_status: 'active',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    beforeEach(() => {
      process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    });

    it('should validate Telegram content correctly', async () => {
      const publisher = createPlatformPublisher(telegramConnection);
      
      // Valid content
      const validResult = await publisher.validate('Hello world!');
      expect(validResult.valid).toBe(true);

      // Content too long
      const longContent = 'a'.repeat(4097);
      const longResult = await publisher.validate(longContent);
      expect(longResult.valid).toBe(false);
      expect(longResult.errors).toContain('Total content exceeds Telegram limit of 4096 characters');
    });

    it('should publish to Telegram successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          ok: true, 
          result: { message_id: 123 } 
        })
      });

      const publisher = createPlatformPublisher(telegramConnection);
      const result = await publisher.publish('Test message');

      expect(result.success).toBe(true);
      expect(result.platformPostId).toBe('telegram_123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest_token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: '@testchannel',
            text: 'Test message',
            parse_mode: 'Markdown'
          })
        })
      );
    });
  });

  describe('Whop Publisher', () => {
    const whopConnection: PlatformConnection = {
      id: 3,
      user_id: 3,
      platform_type: 'whop',
      connection_name: 'Test Whop',
      api_credentials: {
        company_id: 'test_company'
      },
      connection_status: 'active',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    beforeEach(() => {
      process.env.WHOP_API_KEY = 'test_key';
      process.env.NEXT_PUBLIC_WHOP_COMPANY_ID = 'test_company';
    });

    it('should validate Whop content correctly', async () => {
      const publisher = createPlatformPublisher(whopConnection);
      
      // Valid content
      const validResult = await publisher.validate('Hello world!');
      expect(validResult.valid).toBe(true);

      // Empty content
      const emptyResult = await publisher.validate('');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors).toContain('Content is required');

      // Content too long
      const longContent = 'a'.repeat(10001);
      const longResult = await publisher.validate(longContent);
      expect(longResult.valid).toBe(false);
      expect(longResult.errors).toContain('Content exceeds Whop limit of 10000 characters');
    });

    it('should publish to Whop successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'whop_post_123' })
      });

      const publisher = createPlatformPublisher(whopConnection);
      const result = await publisher.publish('Test message', 'Test Title');

      expect(result.success).toBe(true);
      expect(result.platformPostId).toBe('whop_whop_post_123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.whop.com/api/v2/companies/test_company/posts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test_key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: 'Test Title',
            content: 'Test message',
            published: true,
            tags: []
          })
        })
      );
    });
  });

  describe('Unsupported Platform', () => {
    it('should throw error for unsupported platform type', () => {
      const unsupportedConnection = {
        id: 4,
        user_id: 4,
        platform_type: 'unsupported' as 'discord',
        connection_name: 'Unsupported',
        api_credentials: {},
        connection_status: 'active' as const,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      expect(() => createPlatformPublisher(unsupportedConnection))
        .toThrow('Unsupported platform type: unsupported');
    });
  });
});
