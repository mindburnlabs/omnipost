import {
  validateRequest,
  createValidationError,
  sanitize,
  contentValidation,
  commonSchemas,
  postSchemas,
  userSchemas,
} from '../validation';
import { z } from 'zod';

describe('Validation Utilities', () => {
  describe('validateRequest', () => {
    it('should validate correct data successfully', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });

      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      const result = validateRequest(schema, validData);

      expect(result).toEqual({
        success: true,
        data: validData,
      });
    });

    it('should return validation errors for invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });

      const invalidData = {
        email: 'invalid-email',
        name: 'A', // Too short
      };

      const result = validateRequest(schema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0].path).toEqual(['email']);
        expect(result.errors[1].path).toEqual(['name']);
      }
    });
  });

  describe('createValidationError', () => {
    it('should create properly formatted validation error', () => {
      const errors = [
        {
          path: ['email'],
          message: 'Invalid email format',
          code: 'invalid_string' as const,
        },
      ];

      const result = createValidationError(errors);

      expect(result).toEqual({
        error: 'Validation failed',
        details: [
          {
            field: 'email',
            message: 'Invalid email format',
            code: 'invalid_string',
          },
        ],
      });
    });
  });

  describe('sanitize', () => {
    describe('html', () => {
      it('should remove dangerous HTML tags', () => {
        const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p><iframe src="evil.com"></iframe>';
        const result = sanitize.html(maliciousHtml);
        
        expect(result).toBe('<p>Safe content</p>');
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('<iframe>');
      });

      it('should remove javascript: protocols', () => {
        const maliciousHtml = '<a href="javascript:alert(\\'xss\\')">Click me</a>';
        const result = sanitize.html(maliciousHtml);
        
        expect(result).not.toContain('javascript:');
      });

      it('should remove event handlers', () => {
        const maliciousHtml = '<div onclick="alert(\\'xss\\')">Content</div>';
        const result = sanitize.html(maliciousHtml);
        
        expect(result).not.toContain('onclick=');
      });
    });

    describe('xss', () => {
      it('should escape HTML special characters', () => {
        const input = '<script>alert("xss")</script>';
        const result = sanitize.xss(input);
        
        expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      });

      it('should escape quotes and apostrophes', () => {
        const input = `He said "Hello" and she said 'Hi'`;
        const result = sanitize.xss(input);
        
        expect(result).toContain('&quot;');
        expect(result).toContain('&#x27;');
      });
    });

    describe('text', () => {
      it('should trim and normalize whitespace', () => {
        const input = '  Multiple   spaces   between   words  ';
        const result = sanitize.text(input);
        
        expect(result).toBe('Multiple spaces between words');
      });

      it('should limit text length', () => {
        const longText = 'a'.repeat(15000);
        const result = sanitize.text(longText);
        
        expect(result.length).toBe(10000);
      });
    });
  });

  describe('contentValidation', () => {
    describe('isSpam', () => {
      it('should detect spam content', () => {
        const spamContent = 'Buy now for guaranteed results! Click here for free money!';
        expect(contentValidation.isSpam(spamContent)).toBe(true);
      });

      it('should not flag legitimate content as spam', () => {
        const legitimateContent = 'This is a normal post about my experience with the product.';
        expect(contentValidation.isSpam(legitimateContent)).toBe(false);
      });
    });

    describe('checkLength', () => {
      it('should validate Twitter length limits', () => {
        const shortContent = 'Short tweet';
        const longContent = 'a'.repeat(300);

        expect(contentValidation.checkLength(shortContent, 'twitter')).toEqual({
          valid: true,
          limit: 280,
          current: 11,
        });

        expect(contentValidation.checkLength(longContent, 'twitter')).toEqual({
          valid: false,
          limit: 280,
          current: 300,
        });
      });

      it('should handle unknown platforms with default limit', () => {
        const content = 'a'.repeat(500);
        const result = contentValidation.checkLength(content, 'unknown-platform');
        
        expect(result.limit).toBe(1000);
        expect(result.valid).toBe(true);
      });
    });

    describe('extractHashtags', () => {
      it('should extract hashtags from content', () => {
        const content = 'Love this #product and #technology! #ProductReview #tech';
        const hashtags = contentValidation.extractHashtags(content);
        
        expect(hashtags).toEqual(['#product', '#technology', '#productreview', '#tech']);
      });

      it('should remove duplicates and limit to 10', () => {
        const content = '#one #two #one #three #four #five #six #seven #eight #nine #ten #eleven';
        const hashtags = contentValidation.extractHashtags(content);
        
        expect(hashtags).toHaveLength(10);
        expect(new Set(hashtags)).toHaveProperty('size', 10); // No duplicates
      });
    });

    describe('extractMentions', () => {
      it('should extract mentions from content', () => {
        const content = 'Thanks @john_doe and @jane_smith for the great feedback!';
        const mentions = contentValidation.extractMentions(content);
        
        expect(mentions).toEqual(['@john_doe', '@jane_smith']);
      });

      it('should limit to 5 mentions', () => {
        const content = '@one @two @three @four @five @six @seven';
        const mentions = contentValidation.extractMentions(content);
        
        expect(mentions).toHaveLength(5);
      });
    });
  });

  describe('Schema Validation', () => {
    describe('commonSchemas', () => {
      it('should validate UUID format', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const invalidUuid = 'not-a-uuid';

        expect(commonSchemas.id.safeParse(validUuid).success).toBe(true);
        expect(commonSchemas.id.safeParse(invalidUuid).success).toBe(false);
      });

      it('should validate email format', () => {
        const validEmail = 'test@example.com';
        const invalidEmail = 'not-an-email';

        expect(commonSchemas.email.safeParse(validEmail).success).toBe(true);
        expect(commonSchemas.email.safeParse(invalidEmail).success).toBe(false);
      });

      it('should validate platform names', () => {
        const validPlatform = 'twitter';
        const invalidPlatform = 'unknown-platform';

        expect(commonSchemas.platformName.safeParse(validPlatform).success).toBe(true);
        expect(commonSchemas.platformName.safeParse(invalidPlatform).success).toBe(false);
      });
    });

    describe('postSchemas', () => {
      it('should validate post creation data', () => {
        const validPostData = {
          title: 'Test Post',
          content: 'This is test content',
          platforms: ['twitter', 'linkedin'],
          tags: ['test', 'example'],
        };

        const result = postSchemas.create.safeParse(validPostData);
        expect(result.success).toBe(true);
      });

      it('should require at least one platform', () => {
        const invalidPostData = {
          title: 'Test Post',
          content: 'This is test content',
          platforms: [], // Empty array should fail
        };

        const result = postSchemas.create.safeParse(invalidPostData);
        expect(result.success).toBe(false);
      });
    });

    describe('userSchemas', () => {
      it('should validate user registration data', () => {
        const validUserData = {
          email: 'test@example.com',
          password: 'securepassword123',
          name: 'John Doe',
        };

        const result = userSchemas.register.safeParse(validUserData);
        expect(result.success).toBe(true);
      });

      it('should enforce minimum password length', () => {
        const invalidUserData = {
          email: 'test@example.com',
          password: 'short', // Too short
          name: 'John Doe',
        };

        const result = userSchemas.register.safeParse(invalidUserData);
        expect(result.success).toBe(false);
      });
    });
  });
});
