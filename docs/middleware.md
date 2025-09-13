# Middleware Implementation

## Overview

The middleware implementation handles authentication and authorization for protected routes in the application. It uses Supabase Auth to verify user sessions and redirect unauthenticated users to the login page.

## Implementation Details

### File Structure

- `lib/supabase/middleware.ts` - Core middleware implementation
- `middleware.ts` - Root middleware that imports and uses the Supabase middleware

### Protected Routes

The following routes are protected and require authentication:

1. `/dashboard` - Main dashboard page
2. `/requests` - Requests management page
3. `/admin` - Administrative functions
4. `/profile` - User profile page

### Authentication Flow

1. **Environment Check**: The middleware first checks if the required Supabase environment variables are set. If not, it skips authentication.

2. **Session Verification**: For each request, the middleware creates a Supabase server client and retrieves the user's claims using `getClaims()`.

3. **Route Protection**: 
   - If a user accesses a protected route without authentication, they are redirected to the login page
   - If an authenticated user tries to access the login page, they are redirected to the dashboard
   - Public routes are accessible to all users

4. **Redirect with Return URL**: When redirecting unauthenticated users to the login page, the original requested URL is preserved as a query parameter for post-login redirection.

## Configuration

### Environment Variables

The middleware requires the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Middleware Matcher

The root middleware (`middleware.ts`) is configured to match all routes except:

- API routes (`/api/*`)
- Static files (`/_next/static/*`)
- Image optimization files (`/_next/image/*`)
- Favicon (`/favicon.ico`)

## Testing

Middleware tests are located in `middleware.test.ts` and cover the following scenarios:

1. Redirecting unauthenticated users from protected routes
2. Allowing authenticated users to access protected routes
3. Redirecting authenticated users from login page to dashboard
4. Allowing unauthenticated users to access login page
5. Allowing access to public routes for unauthenticated users
6. Skipping middleware check when environment variables are not set

## Best Practices

1. **Cookie Management**: The middleware properly handles cookies to maintain session consistency between client and server.

2. **Fluid Compute Compatibility**: The Supabase client is created on each request rather than being stored in a global variable, making it compatible with Next.js Fluid Compute.

3. **Error Handling**: The middleware gracefully handles cases where environment variables are not set.

4. **Security**: The `getClaims()` method is used to verify user sessions, which is important for preventing random logouts.

## Adding New Protected Routes

To add a new protected route:

1. Add the route path to the `protectedPaths` array in `lib/supabase/middleware.ts`
2. Ensure the route follows the Next.js App Router structure
3. Test the authentication flow for the new route

## Troubleshooting

### Random Logouts

If users are experiencing random logouts:

1. Ensure `getClaims()` is called in the middleware
2. Verify that cookies are properly handled in the middleware response
3. Check that the Supabase client is created correctly with cookie management

### Redirect Loops

If redirect loops occur:

1. Verify that the protected paths array matches the actual route structure
2. Check that the login page path is correctly configured
3. Ensure environment variables are properly set