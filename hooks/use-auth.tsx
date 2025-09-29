'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

const supabase = createClient()

export function useAuth() {
  const queryClient = useQueryClient()

  // Query to get current user
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<User | null> => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })

  // Query to get current session
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })

  // Mutation for Azure sign in
  const signInMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email openid profile',
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate auth queries to refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (error) => {
      console.error('Azure sign in error:', error)
    },
  })

  // Helper function to clear all storage and cookies
  const clearAllStorage = () => {
    try {
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear all cookies
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        
        // Clear cookie for current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        
        // Clear for parent domain (if subdomain)
        const parts = window.location.hostname.split('.')
        if (parts.length > 2) {
          const parentDomain = `.${parts.slice(-2).join('.')}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`
        }
      })
      
      console.log('All storage and cookies cleared successfully')
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  // Mutation for sign out
  const signOutMutation = useMutation({
    mutationFn: async () => {
      // Global logout from all devices
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
    },
    onSuccess: () => {
      // Clear all queries first
      queryClient.clear()
      
      // Clear all storage
      clearAllStorage()
      
      // Force redirect with complete navigation reset
      window.location.href = '/auth/login?logout=true'
    },
    onError: (error) => {
      console.error('Sign out error:', error)
      
      // Even if logout fails, clear storage and redirect
      clearAllStorage()
      window.location.href = '/auth/login?logout=true'
    },
  })

  return {
    user,
    session,
    isLoading: isUserLoading || isSessionLoading,
    isAuthenticated: !!user,
    signInWithAzure: signInMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  }
}
