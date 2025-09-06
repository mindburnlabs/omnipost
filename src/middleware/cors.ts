import { NextRequest, NextResponse } from 'next/server';

export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
}

const defaultOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://omnipost-production.up.railway.app', 'https://app.omnipost.ai']
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false
};

export function createCors(options: CorsOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return function cors(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');
    const requestMethod = request.method;

    // Handle origin
    let allowOrigin = '';
    
    if (typeof config.origin === 'boolean') {
      allowOrigin = config.origin ? (origin || '*') : '';
    } else if (typeof config.origin === 'string') {
      allowOrigin = config.origin;
    } else if (Array.isArray(config.origin)) {
      if (origin && config.origin.includes(origin)) {
        allowOrigin = origin;
      }
    } else if (typeof config.origin === 'function') {
      if (origin && config.origin(origin)) {
        allowOrigin = origin;
      }
    }

    // Set CORS headers
    if (allowOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    }

    if (config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (config.methods && config.methods.length > 0) {
      response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
    }

    if (config.allowedHeaders && config.allowedHeaders.length > 0) {
      response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    }

    if (config.maxAge) {
      response.headers.set('Access-Control-Max-Age', config.maxAge.toString());
    }

    // Handle preflight requests
    if (requestMethod === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
  };
}

// Production CORS configuration
export const productionCors = createCors({
  origin: [
    'https://omnipost-production.up.railway.app',
    'https://app.omnipost.ai',
    'https://omnipost.ai'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 86400
});

// Development CORS configuration  
export const developmentCors = createCors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  maxAge: 3600
});

// API-specific CORS configuration
export const apiCors = createCors({
  origin: (origin: string) => {
    // Allow all localhost origins in development
    if (process.env.NODE_ENV !== 'production') {
      return origin.includes('localhost') || origin.includes('127.0.0.1');
    }
    
    // Production whitelist
    const allowedOrigins = [
      'https://omnipost-production.up.railway.app',
      'https://app.omnipost.ai',
      'https://omnipost.ai'
    ];
    
    return allowedOrigins.includes(origin);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With'
  ],
  credentials: true,
  maxAge: 86400
});
