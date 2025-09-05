
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ENABLE_AUTH } from "@/constants/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and API routes
  if (
    pathname.startsWith('/next_api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login' ||
    pathname === '/' ||
    !ENABLE_AUTH
  ) {
    return NextResponse.next();
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
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
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
