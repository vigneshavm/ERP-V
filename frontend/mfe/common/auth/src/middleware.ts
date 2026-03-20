import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/force-logout',
  '/api/health',
];

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_me';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Only intercept /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 3. Let rewrite proxy handle /api authentication
  // The backends (port 5000, 5001, etc.) already have their own protect middleware
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
