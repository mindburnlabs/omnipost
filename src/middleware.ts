
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ENABLE_AUTH } from "@/constants/auth";
import { apiRateLimit, authRateLimit } from "./middleware/rateLimit";
import { apiCors } from "./middleware/cors";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  // Apply security headers to all responses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Apply CORS for API routes
  if (pathname.startsWith('/next_api/')) {
    response = apiCors(request, response);
    
    // Apply rate limiting for API routes
    const rateLimitResponse = pathname.includes('/auth/') 
      ? authRateLimit(request) 
      : apiRateLimit(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Skip authentication middleware for public routes
  if (
    pathname.startsWith('/next_api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login' ||
    pathname === '/' ||
    !ENABLE_AUTH
  ) {
    return response;
  }

  // Check authentication for protected routes
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/composer') || 
      pathname.startsWith('/calendar') ||
      pathname.startsWith('/library') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/templates') ||
      pathname.startsWith('/assets') ||
      pathname.startsWith('/automation') ||
      pathname.startsWith('/experiments') ||
      pathname.startsWith('/approvals') ||
      pathname.startsWith('/insights') ||
      pathname.startsWith('/bulk') ||
      pathname.startsWith('/brand') ||
      pathname.startsWith('/status')) {
    
    const token = request.cookies.get('auth-token')?.value;
    const { valid } = await verifyToken(token);

    if (!valid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Apply security headers to redirect response too
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
