import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_CONFIG } from '@/lib/auth/config'
import { getCurrentSession } from '@/lib/auth/utils'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/requests',
  '/admin'
]

// Define public routes
const publicRoutes = [
  '/',
  '/auth/callback'
]

/**
 * Middleware to protect routes based on authentication status
 * 
 * This middleware checks if a user is authenticated before allowing access to protected routes.
 * Unauthenticated users are redirected to the login page with a redirect parameter.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  )
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // If it's not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // For protected routes, check authentication status
  try {
    const session = await getCurrentSession()
    
    // If user is authenticated, allow access
    if (session) {
      return NextResponse.next()
    }
    
    // If user is not authenticated, redirect to login page
    const redirectUrl = new URL(AUTH_CONFIG.redirects.notAuthenticated, request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Authentication check failed:', error)
    
    // On error, redirect to login page
    const redirectUrl = new URL(AUTH_CONFIG.redirects.notAuthenticated, request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    
    return NextResponse.redirect(redirectUrl)
  }
}

// Configure which routes the middleware should run on
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
}