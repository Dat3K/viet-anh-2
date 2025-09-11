import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, getCurrentSession, syncUserProfile } from '@/lib/auth/utils'
import { useAuthStore } from '@/lib/auth/store'
import { Profile } from '@/types/database'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

// Hook for fetching current user
export function useCurrentUser() {
  const { setProfile, setError } = useAuthStore()

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401/403 errors
      if (error && (error as { status?: number })?.status === 401 || (error as { status?: number })?.status === 403) {
        return false
      }
      return failureCount < 3
    },
    onSuccess: (profile: Profile | null) => {
      setProfile(profile)
    },
    onError: (error: unknown) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch user')
    },
  })
}

// Hook for fetching current session
export function useCurrentSession() {
  const { setSession, setError } = useAuthStore()

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: getCurrentSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401/403 errors
      if (error && (error as { status?: number })?.status === 401 || (error as { status?: number })?.status === 403) {
        return false
      }
      return failureCount < 3
    },
    onSuccess: (session) => {
      setSession(session)
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch session')
    },
  })
}

// Hook for syncing user profile
export function useSyncUserProfile() {
  const queryClient = useQueryClient()
  const { setProfile, setError } = useAuthStore()

  return useMutation({
    mutationFn: syncUserProfile,
    onSuccess: (profile) => {
      setProfile(profile)
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to sync user profile')
    },
  })
}

// Hook for authentication state
export function useAuth() {
  const userQuery = useCurrentUser()
  const sessionQuery = useCurrentSession()
  const syncUserMutation = useSyncUserProfile()
  
  const {
    profile: user,
    session,
    isLoading,
    error,
    isAuthenticated,
    initialize,
    logout,
    refreshUser,
  } = useAuthStore()

  return {
    // State
    user,
    session,
    isLoading: isLoading || userQuery.isLoading || sessionQuery.isLoading,
    error: error || userQuery.error || sessionQuery.error,
    isAuthenticated,
    
    // Actions
    initialize,
    logout,
    refreshUser,
    syncUser: syncUserMutation.mutate,
    isSyncing: syncUserMutation.isPending,
    
    // Query states
    userQuery,
    sessionQuery,
    syncUserMutation,
  }
}

// Hook for checking authentication status
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth()
  
  return {
    isAuthenticated,
    isLoading,
    isAuthenticating: isLoading,
  }
}

// Hook for checking user roles
export function useHasRole(requiredRole: string) {
  const { user, isAuthenticated } = useAuth()
  
  return {
    hasRole: isAuthenticated && user?.role === requiredRole,
    isLoading: false,
  }
}

// Hook for checking if user has any of the specified roles
export function useHasAnyRole(requiredRoles: string[]) {
  const { user, isAuthenticated } = useAuth()
  
  return {
    hasAnyRole: isAuthenticated && user?.role ? requiredRoles.includes(user.role) : false,
    isLoading: false,
  }
}

// Hook for checking if user is active
export function useIsActiveUser() {
  const { user, isAuthenticated } = useAuth()
  
  return {
    isActive: isAuthenticated && user?.is_active,
    isLoading: false,
  }
}

// Hook for admin access check
export function useCanAccessAdmin() {
  const { user, isAuthenticated } = useAuth()
  
  return {
    canAccessAdmin: isAuthenticated && user?.role === 'admin' && user?.is_active,
    isLoading: false,
  }
}

// Hook for dashboard access check
export function useCanAccessDashboard() {
  const { user, isAuthenticated } = useAuth()
  
  return {
    canAccessDashboard: isAuthenticated && user?.is_active,
    isLoading: false,
  }
}
