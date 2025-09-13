'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoading, error, isAuthenticated } = useAuth()
  const { setUser, setIsAuthenticated, setIsLoading, setError } = useAuthStore()

  // Sync auth state with the store
  useEffect(() => {
    setUser(user)
    setIsAuthenticated(isAuthenticated)
    setIsLoading(isLoading)
    setError(error)
  }, [user, isAuthenticated, isLoading, error, setUser, setIsAuthenticated, setIsLoading, setError])

  return <>{children}</>
}