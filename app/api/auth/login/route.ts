import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
          tenant: 'common',
        },
      },
    })

    if (error) {
      console.error('Azure OAuth sign-in error:', error)
      return NextResponse.json(
        { error: 'Failed to initiate Azure OAuth sign-in' },
        { status: 400 }
      )
    }

    return NextResponse.json({ url: data.url })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Please use POST method for login' })
}