'use client'

import { useEffect, useMemo } from 'react'
import { useAuth } from './use-auth'
import { 
  useProfile, 
  useProfileLoading, 
  useProfileError, 
  useIsProfileStale,
  useProfileActions
} from '@/lib/stores/profile-store'
import { getProfile } from '@/lib/services/profile-service'

/**
 * Custom hook that manages profile state in sync with authentication
 * Automatically fetches profile when user logs in and clears when logs out
 * Optimized to work with database trigger for automatic profile creation
 */
export function useProfileSync() {
  const { user, isAuthenticated } = useAuth()
  const profile = useProfile()
  const isLoading = useProfileLoading()
  const error = useProfileError()
  const isStale = useIsProfileStale()
  const { setProfile, setLoading, setError, clearProfile } = useProfileActions()

  // Memoize dependencies to prevent unnecessary effect runs
  const dependencies = useMemo(() => ({
    userId: user?.id,
    userEmail: user?.email,
    userFullName: user?.user_metadata?.full_name,
    profileId: profile?.id,
    isAuthenticated,
    isStale
  }), [user?.id, user?.email, user?.user_metadata?.full_name, profile?.id, isAuthenticated, isStale])

  useEffect(() => {
    if (!dependencies.isAuthenticated || !user) {
      // Clear profile when user is not authenticated
      if (profile) {
        clearProfile()
      }
      return
    }

    // If profile exists and is not stale, don't refetch
    if (profile && profile.id === dependencies.userId && !dependencies.isStale) {
      return
    }

    // Fetch profile for authenticated user
    const fetchUserProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        const userProfile = await getProfile(dependencies.userId!)
        
        setProfile(userProfile)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
        setError(errorMessage)
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [dependencies, user, profile, setProfile, setLoading, setError, clearProfile])

  return {
    profile,
    isLoading,
    error,
    isStale,
    refetch: async () => {
      if (user) {
        setLoading(true)
        try {
          const userProfile = await getProfile(user.id)
          setProfile(userProfile)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to refresh profile')
        } finally {
          setLoading(false)
        }
      }
    }
  }
}

/**
 * Hook for accessing profile data with automatic sync
 */
export function useUserProfile() {
  const syncResult = useProfileSync()
  return syncResult
}
