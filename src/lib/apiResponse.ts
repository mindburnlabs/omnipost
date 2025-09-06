import { NextResponse } from 'next/server';

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  timestamp: string;
  requestId?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===========================================
// ERROR CODES
// ===========================================

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // External Services
  PLATFORM_ERROR: 'PLATFORM_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  
  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// ===========================================
// HTTP STATUS CODES
// ===========================================

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ===========================================
// API RESPONSE BUILDERS
// ===========================================

export class ApiResponseBuilder {
  /**
   * Create a successful response
   */
  static success<T>(
    data: T,
    message?: string,
    meta?: ApiSuccessResponse['meta']
  ): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      meta,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: HttpStatus.OK });
  }

  /**
   * Create a created response (201)
   */
  static created<T>(
    data: T,
    message: string = 'Resource created successfully'
  ): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: HttpStatus.CREATED });
  }

  /**
   * Create a no content response (204)
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
  }

  /**
   * Create an error response
   */
  static error(
    code: string,
    message: string,
    status: number = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any,
    field?: string
  ): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        field,
      },
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Bad request error (400)
   */
  static badRequest(
    message: string = 'Bad request',
    details?: any
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.INVALID_INPUT,
      message,
      HttpStatus.BAD_REQUEST,
      details
    );
  }

  /**
   * Validation error (422)
   */
  static validationError(
    message: string = 'Validation failed',
    details?: any
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.VALIDATION_ERROR,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details
    );
  }

  /**
   * Unauthorized error (401)
   */
  static unauthorized(
    message: string = 'Unauthorized'
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.UNAUTHORIZED,
      message,
      HttpStatus.UNAUTHORIZED
    );
  }

  /**
   * Forbidden error (403)
   */
  static forbidden(
    message: string = 'Forbidden'
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.FORBIDDEN,
      message,
      HttpStatus.FORBIDDEN
    );
  }

  /**
   * Not found error (404)
   */
  static notFound(
    message: string = 'Resource not found'
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * Conflict error (409)
   */
  static conflict(
    message: string = 'Resource already exists'
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.ALREADY_EXISTS,
      message,
      HttpStatus.CONFLICT
    );
  }

  /**
   * Rate limit exceeded (429)
   */
  static rateLimitExceeded(
    message: string = 'Rate limit exceeded'
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      message,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  /**
   * Internal server error (500)
   */
  static internalError(
    message: string = 'Internal server error',
    details?: any
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details
    );
  }

  /**
   * Service unavailable (503)
   */
  static serviceUnavailable(
    message: string = 'Service temporarily unavailable'
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      ErrorCodes.SERVICE_UNAVAILABLE,
      message,
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

// ===========================================
// ERROR HANDLING UTILITIES
// ===========================================

/**
 * Handle and format database errors
 */
export function handleDatabaseError(error: any): NextResponse<ApiErrorResponse> {
  console.error('Database error:', error);

  // PostgreSQL error codes
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return ApiResponseBuilder.conflict('Resource already exists');
      case '23503': // Foreign key violation
        return ApiResponseBuilder.badRequest('Referenced resource does not exist');
      case '23514': // Check violation
        return ApiResponseBuilder.badRequest('Data violates constraints');
      default:
        break;
    }
  }

  return ApiResponseBuilder.error(
    ErrorCodes.DATABASE_ERROR,
    'Database operation failed',
    HttpStatus.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}

/**
 * Handle and format external API errors
 */
export function handleExternalApiError(
  error: any,
  platform?: string
): NextResponse<ApiErrorResponse> {
  console.error(`External API error (${platform}):`, error);

  const message = platform 
    ? `${platform} API error: ${error.message || 'Request failed'}`
    : `External API error: ${error.message || 'Request failed'}`;

  return ApiResponseBuilder.error(
    ErrorCodes.EXTERNAL_API_ERROR,
    message,
    HttpStatus.SERVICE_UNAVAILABLE,
    process.env.NODE_ENV === 'development' ? error : undefined
  );
}

/**
 * Generic error handler for API routes
 */
export function handleApiError(error: any): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  // Handle known error types
  if (error.name === 'ValidationError') {
    return ApiResponseBuilder.validationError(error.message, error.details);
  }

  if (error.name === 'UnauthorizedError') {
    return ApiResponseBuilder.unauthorized(error.message);
  }

  if (error.name === 'ForbiddenError') {
    return ApiResponseBuilder.forbidden(error.message);
  }

  if (error.name === 'NotFoundError') {
    return ApiResponseBuilder.notFound(error.message);
  }

  // Default to internal server error
  return ApiResponseBuilder.internalError(
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create paginated response metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ApiSuccessResponse['meta'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

// ===========================================
// API WRAPPER DECORATOR
// ===========================================

/**
 * Decorator to wrap API route handlers with standardized error handling
 */
export function apiRoute(handler: Function) {
  return async function wrappedHandler(req: Request, context?: any) {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ===========================================
// TYPE GUARDS
// ===========================================

export function isApiSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}
