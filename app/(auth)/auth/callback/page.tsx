import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { code, error: oauthError } = await searchParams
  
  // Handle OAuth callback
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      redirect('/login?error=auth_failed')
    }
    
    // Get the user session after successful exchange
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // User is authenticated, redirect to home
      redirect('/')
    }
  }
  
  // Handle OAuth error
  if (oauthError) {
    console.error('OAuth error:', oauthError)
    redirect('/login?error=auth_failed')
  }
  
  // No code or error, redirect to login
  redirect('/login')
}
