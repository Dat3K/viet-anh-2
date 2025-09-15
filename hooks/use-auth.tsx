'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

const supabase = createClient()

export function useAuth() {
  const router = useRouter()
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

  // Mutation for sign out
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      // Clear all queries and redirect to login
      queryClient.clear()
      router.push('/auth/login')
    },
    onError: (error) => {
      console.error('Sign out error:', error)
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
