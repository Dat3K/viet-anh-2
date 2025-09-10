import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage() {
  const supabase = await createClient()
  
  // Get the user session
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // User is authenticated, redirect to home
    redirect('/')
  } else {
    // Authentication failed, redirect to login with error
    redirect('/login?error=auth_failed')
  }
}
