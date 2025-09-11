'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthFormState = {
  errors?: {
    general?: string[]
  }
  message?: string
}

export async function signInWithMicrosoftAction() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scopes: 'email openid profile',
    },
  })

  if (error) {
    console.error('Microsoft sign in error:', error)
    redirect('/login?error=auth_failed')
  }

  redirect(data.url)
}
