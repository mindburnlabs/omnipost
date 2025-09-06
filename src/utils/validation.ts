import { z } from 'zod';

// ===========================================
// COMMON VALIDATION SCHEMAS
// ===========================================

export const commonSchemas = {
  // Basic types
  id: z.string().uuid('Invalid ID format'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  email: z.string().email('Invalid email format'),
  url: z.string().url('Invalid URL format'),
  
  // Content validation
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  
  // Platform specific
  platformName: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube', 'discord', 'telegram']),
  
  // Dates
  dateString: z.string().datetime('Invalid date format'),
  scheduledAt: z.string().datetime().optional(),
  
  // Pagination
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  
  // Search
  query: z.string().min(1).max(100).optional(),
  
  // Status
  status: z.enum(['draft', 'scheduled', 'published', 'failed', 'cancelled']),
};

// ===========================================
// API REQUEST VALIDATION SCHEMAS
// ===========================================

export const postSchemas = {
  create: z.object({
    title: commonSchemas.title,
    content: commonSchemas.content,
    platforms: z.array(commonSchemas.platformName).min(1, 'At least one platform required'),
    scheduledAt: commonSchemas.scheduledAt,
    tags: z.array(z.string()).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
  }),
  
  update: z.object({
    id: commonSchemas.id,
    title: commonSchemas.title.optional(),
    content: commonSchemas.content.optional(),
    platforms: z.array(commonSchemas.platformName).optional(),
    scheduledAt: commonSchemas.scheduledAt,
    tags: z.array(z.string()).optional(),
    status: commonSchemas.status.optional(),
  }),
  
  list: z.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    status: commonSchemas.status.optional(),
    platform: commonSchemas.platformName.optional(),
    query: commonSchemas.query,
  }),
};

export const userSchemas = {
  register: z.object({
    email: commonSchemas.email,
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    name: z.string().min(2, 'Name too short').max(50, 'Name too long'),
  }),
  
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
  
  updateProfile: z.object({
    name: z.string().min(2).max(50).optional(),
    email: commonSchemas.email.optional(),
    avatar: z.string().url().optional(),
  }),
};

export const platformSchemas = {
  connect: z.object({
    platform: commonSchemas.platformName,
    credentials: z.record(z.string()).refine(
      (creds) => Object.keys(creds).length > 0,
      'Credentials are required'
    ),
  }),
  
  disconnect: z.object({
    platform: commonSchemas.platformName,
  }),
};

// ===========================================
// VALIDATION HELPER FUNCTIONS
// ===========================================

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; data: T 
} | { 
  success: false; errors: z.ZodError['errors'] 
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}

export function createValidationError(errors: z.ZodError['errors']) {
  return {
    error: 'Validation failed',
    details: errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };
}

// Middleware helper for API routes
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: (validatedData: T, ...args: any[]) => any) => {
    return async (req: any, ...args: any[]) => {
      const validation = validateRequest(schema, req.body);
      
      if (!validation.success) {
        return Response.json(
          createValidationError(validation.errors),
          { status: 400 }
        );
      }
      
      return handler(validation.data, req, ...args);
    };
  };
}

// ===========================================
// SANITIZATION FUNCTIONS
// ===========================================

export const sanitize = {
  // Basic HTML sanitization (removes scripts, dangerous tags)
  html: (input: string): string => {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },
  
  // SQL injection prevention (basic)
  sql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '')
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '');
  },
  
  // XSS prevention
  xss: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  
  // General text sanitization
  text: (input: string): string => {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .substring(0, 10000); // Limit length
  },
};

// ===========================================
// CONTENT VALIDATION
// ===========================================

export const contentValidation = {
  // Check for spam indicators
  isSpam: (content: string): boolean => {
    const spamIndicators = [
      /buy now/gi,
      /click here/gi,
      /free money/gi,
      /guaranteed/gi,
      /make money fast/gi,
      /urgent/gi,
    ];
    
    return spamIndicators.some(pattern => pattern.test(content));
  },
  
  // Check content length for different platforms
  checkLength: (content: string, platform: string): { valid: boolean; limit: number; current: number } => {
    const limits: Record<string, number> = {
      twitter: 280,
      linkedin: 3000,
      facebook: 63206,
      instagram: 2200,
      tiktok: 2200,
    };
    
    const limit = limits[platform] || 1000;
    const current = content.length;
    
    return {
      valid: current <= limit,
      limit,
      current,
    };
  },
  
  // Extract and validate hashtags
  extractHashtags: (content: string): string[] => {
    const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
    return hashtags
      .map(tag => tag.toLowerCase())
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, 10); // Limit to 10 hashtags
  },
  
  // Extract and validate mentions
  extractMentions: (content: string): string[] => {
    const mentions = content.match(/@[a-zA-Z0-9_]+/g) || [];
    return mentions
      .map(mention => mention.toLowerCase())
      .filter((mention, index, arr) => arr.indexOf(mention) === index)
      .slice(0, 5); // Limit to 5 mentions
  },
};
