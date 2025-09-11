import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AUTH_CONFIG } from '@/lib/auth/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Handle the OAuth callback
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      request.nextUrl.searchParams.get('code') || ''
    )

    if (error) {
      console.error('OAuth callback error:', error)
      // Redirect to login page with error
      const redirectUrl = new URL(AUTH_CONFIG.redirects.notAuthenticated, request.url)
      redirectUrl.searchParams.set('error', 'authentication_failed')
      return NextResponse.redirect(redirectUrl)
    }

    // Sync user profile with database
    if (data.user) {
      try {
        await supabase.rpc('sync_user_profile', {
          user_full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          user_phone: data.user.user_metadata?.phone,
          user_employee_code: data.user.user_metadata?.employee_code,
          user_department_id: data.user.user_metadata?.department_id,
          user_position_id: data.user.user_metadata?.position_id,
          user_preferred_username: data.user.user_metadata?.preferred_username,
        })
      } catch (syncError) {
        console.error('User profile sync error:', syncError)
        // Don't fail the login if profile sync fails, just log it
      }
    }

    // Redirect to dashboard or specified redirect URL
    const redirectPath = request.nextUrl.searchParams.get('redirect') || AUTH_CONFIG.redirects.loginSuccess
    const redirectUrl = new URL(redirectPath, request.url)
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Callback handler error:', error)
    const redirectUrl = new URL(AUTH_CONFIG.redirects.notAuthenticated, request.url)
    redirectUrl.searchParams.set('error', 'authentication_failed')
    return NextResponse.redirect(redirectUrl)
  }
}