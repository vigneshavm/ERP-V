import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
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

  // 3. Extract token from Cookie or Authorization header
  let token = request.cookies.get('auth_token')?.value;

  if (!token && request.headers.get('authorization')) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    // 4. Validate JWT
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jose.jwtVerify(token, secret);

    // 5. Token is valid, proceed to proxy
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware Auth Error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
