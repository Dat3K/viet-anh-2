import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { authService, AuthResponse } from '@/services/auth-service'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: () => Promise<AuthResponse>
  signOut: () => Promise<AuthResponse>
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
 const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(async (): Promise<AuthResponse> => {
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await authService.signInWithAzureAD()
      
      if (!response.success) {
        setError(response.error || 'Sign in failed')
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async (): Promise<AuthResponse> => {
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await authService.signOut()
      
      if (response.success) {
        setUser(null)
      } else {
        setError(response.error || 'Sign out failed')
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      if (!mounted) return

      try {
        const response = await authService.getCurrentUser()
        
        if (response.success && response.data && mounted) {
          setUser(response.data)
        } else if (response.error && mounted) {
          // Don't set "Auth session missing!" error during initial auth check
          // This is expected when user is not logged in yet
          if (response.error !== 'Auth session missing!') {
            setError(response.error)
          }
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize auth state'
          // Don't set "Auth session missing!" error during initial auth check
          if (errorMessage !== 'Auth session missing!') {
            setError(errorMessage)
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth state changes
    const subscription = authService.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        setError(null)
      } else {
        setUser(null)
      }
    })

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }
}