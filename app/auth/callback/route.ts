import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth error from provider:', { error, errorDescription })
    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    try {
      const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Exchange code for session failed:', {
          error: exchangeError.message,
          status: exchangeError.status,
          code: code.substring(0, 10) + '...' // Log partial code for debugging
        })
        
        const errorUrl = new URL('/auth/auth-code-error', origin)
        errorUrl.searchParams.set('error', 'exchange_failed')
        errorUrl.searchParams.set('error_description', exchangeError.message)
        return NextResponse.redirect(errorUrl)
      }

      if (!data.user) {
        console.error('No user data returned after successful exchange')
        const errorUrl = new URL('/auth/auth-code-error', origin)
        errorUrl.searchParams.set('error', 'no_user_data')
        return NextResponse.redirect(errorUrl)
      }

      console.log('Auth successful for user:', {
        userId: data.user.id,
        email: data.user.email,
        provider: data.user.app_metadata?.provider
      })

      // Ensure user profile exists after OAuth login
      try {
        await ensureUserProfile(supabase, data.user.id)
      } catch (profileError) {
        console.error('Failed to ensure user profile:', profileError)
        // Continue with login even if profile creation fails
        // The user can still access the app and profile will be created on next login attempt
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      const errorUrl = new URL('/auth/auth-code-error', origin)
      errorUrl.searchParams.set('error', 'unexpected_error')
      errorUrl.searchParams.set('error_description', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code parameter provided
  console.error('Auth callback called without code parameter')
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('error', 'missing_code')
  errorUrl.searchParams.set('error_description', 'Authorization code not provided')
  return NextResponse.redirect(errorUrl)
}

/**
 * Ensure user profile exists, create if missing
 * Wait for database trigger or create manually if trigger fails
 */
async function ensureUserProfile(supabase: any, userId: string) {
  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (existingProfile) {
    console.log(`Profile already exists for user: ${userId}`)
    return // Profile already exists
  }

  // Get user auth data for profile creation
  const { data: authUser } = await supabase.auth.getUser()
  if (!authUser.user) {
    throw new Error('No authenticated user found')
  }

  // Wait for database trigger to create profile (max 3 seconds)
  const maxAttempts = 6
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (profile) {
      console.log(`Profile found for user ${userId} after ${attempt} attempts`)
      return
    }

    if (attempt < maxAttempts) {
      // Wait before next attempt (exponential backoff)
      const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // If trigger failed, create profile manually
  console.log(`Database trigger failed for user ${userId}, creating profile manually`)
  
  // Use specific default role ID
  const defaultRoleId = 'b880ba01-cf3d-469a-9e10-11fb04ed4529' // "Người dùng mới" role
  
  // Extract full_name from user metadata safely
  const metadata = authUser.user.raw_user_meta_data || {}
  const fullName = metadata.full_name || 
                   metadata.name || 
                   (metadata.given_name && metadata.family_name ? 
                    `${metadata.given_name} ${metadata.family_name}`.trim() : 
                    authUser.user.email)

  // Create profile manually
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName || authUser.user.email,
      email: authUser.user.email,
      role_id: defaultRoleId,
      is_active: true
    })

  if (insertError) {
    console.error('Failed to create profile manually:', insertError)
    throw new Error(`Failed to create user profile: ${insertError.message}`)
  }

  console.log(`Profile created manually for user ${userId} with default role`)
}
