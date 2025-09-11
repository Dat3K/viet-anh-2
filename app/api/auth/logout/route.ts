import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AUTH_CONFIG } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 400 }
      )
    }

    // Redirect to home page after logout
    const redirectUrl = new URL(AUTH_CONFIG.redirects.logoutSuccess, request.url)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Please use POST method for logout' })
}