'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
})

export function useAuthContext() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Set initial auth data in React Query cache
      queryClient.setQueryData(['auth', 'user'], session?.user || null)
      queryClient.setQueryData(['auth', 'session'], session)
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        // Update React Query cache with new auth state
        queryClient.setQueryData(['auth', 'user'], session?.user || null)
        queryClient.setQueryData(['auth', 'session'], session)

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            // Invalidate all queries to refetch with new auth context
            queryClient.invalidateQueries()
            break
          case 'SIGNED_OUT':
            // Clear all cached data on sign out
            queryClient.clear()
            break
          case 'TOKEN_REFRESHED':
            // Token was refreshed, update cache
            queryClient.invalidateQueries({ queryKey: ['auth'] })
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, supabase.auth])

  return (
    <AuthContext.Provider value={{ user: null, session: null }}>
      {children}
    </AuthContext.Provider>
  )
}
