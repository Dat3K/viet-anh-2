'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server action to sign in with Azure AD
 */
export async function signInWithAzureAD() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scopes: 'email profile',
    },
  })
  
  if (error) {
    console.error('Sign in error:', error)
    return { success: false, error: error.message }
  }
  
  // Redirect to Azure AD login page
  if (data.url) {
    redirect(data.url)
  }
  
  return { success: true }
}

/**
 * Server action to sign out
 */
export async function signOut() {
 const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Server action to get the current user
 */
export async function getCurrentUser() {
 const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Get user error:', error)
    return { success: false, error: error.message }
  }
  
  if (!user) {
    return { success: false, error: 'No user found' }
  }
  
  return { success: true, user }
}