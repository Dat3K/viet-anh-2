'use client'

import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { StoreApi, UseBoundStore } from 'zustand'
import { ProfileWithDetails } from '@/types/database'

// Profile store state interface
interface ProfileState {
  profile: ProfileWithDetails | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

// Profile store actions interface
interface ProfileActions {
  setProfile: (profile: ProfileWithDetails | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearProfile: () => void
  updateProfile: (updates: Partial<ProfileWithDetails>) => void
  refreshProfile: () => Promise<void>
}

// Initial state
const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  lastFetched: null,
}

// Create the profile store with combine middleware for type inference
export const useProfileStore = create(
  combine(initialState, (set, get) => ({
    // Actions
    setProfile: (profile: ProfileWithDetails | null) => {
      set({
        profile,
        error: null,
        lastFetched: profile ? Date.now() : null,
      })
    },

    setLoading: (isLoading: boolean) => {
      set({ isLoading })
    },

    setError: (error: string | null) => {
      set({ error, isLoading: false })
    },

    clearProfile: () => {
      set({
        profile: null,
        isLoading: false,
        error: null,
        lastFetched: null,
      })
    },

    updateProfile: (updates: Partial<ProfileWithDetails>) => {
      const currentProfile = get().profile
      if (currentProfile) {
        set({
          profile: { ...currentProfile, ...updates },
          lastFetched: Date.now(),
        })
      }
    },

    refreshProfile: async () => {
      const { fetchProfile } = await import('@/lib/services/profile-service')
      const currentProfile = get().profile
      
      if (!currentProfile?.id) {
        set({ error: 'No profile ID available for refresh' })
        return
      }

      set({ isLoading: true, error: null })
      
      try {
        const updatedProfile = await fetchProfile(currentProfile.id)
        set({
          profile: updatedProfile,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        })
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to refresh profile',
        })
      }
    },
  }))
)

// Auto-generated selectors pattern (most optimal approach)
type WithSelectors<S> = S extends { getState: () => infer T } 
  ? S & { use: { [K in keyof T]: () => T[K] } } 
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }
  return store
}

// Create auto-generated selectors
export const profileStore = createSelectors(useProfileStore)

// Usage examples:
// const profile = profileStore.use.profile()
// const isLoading = profileStore.use.isLoading()
// const setProfile = profileStore.use.setProfile()

// Pre-defined stable selectors for common use cases
const profileSelector = (state: ReturnType<typeof useProfileStore.getState>) => state.profile
const loadingSelector = (state: ReturnType<typeof useProfileStore.getState>) => state.isLoading
const errorSelector = (state: ReturnType<typeof useProfileStore.getState>) => state.error

// Stable actions object to prevent infinite loops
const STABLE_ACTIONS = {
  setProfile: null as any,
  setLoading: null as any,
  setError: null as any,
  clearProfile: null as any,
  updateProfile: null as any,
  refreshProfile: null as any,
}

// Initialize stable actions once
let actionsInitialized = false
const initializeActions = (state: ReturnType<typeof useProfileStore.getState>) => {
  if (!actionsInitialized) {
    STABLE_ACTIONS.setProfile = state.setProfile
    STABLE_ACTIONS.setLoading = state.setLoading
    STABLE_ACTIONS.setError = state.setError
    STABLE_ACTIONS.clearProfile = state.clearProfile
    STABLE_ACTIONS.updateProfile = state.updateProfile
    STABLE_ACTIONS.refreshProfile = state.refreshProfile
    actionsInitialized = true
  }
  return STABLE_ACTIONS
}

// Actions selector with stable reference
const actionsSelector = (state: ReturnType<typeof useProfileStore.getState>) => {
  return initializeActions(state)
}

// Computed selectors (stable references)
const profileFullNameSelector = (state: ReturnType<typeof useProfileStore.getState>) => 
  state.profile?.full_name || ''

const profileDepartmentSelector = (state: ReturnType<typeof useProfileStore.getState>) => 
  state.profile?.department?.name || ''

const profileRoleSelector = (state: ReturnType<typeof useProfileStore.getState>) => 
  state.profile?.role?.name || ''

const profileEmailSelector = (state: ReturnType<typeof useProfileStore.getState>) => 
  state.profile?.email || ''

// Optimized hooks with stable selectors using useShallow
export const useProfile = () => useProfileStore(profileSelector)
export const useProfileLoading = () => useProfileStore(loadingSelector)
export const useProfileError = () => useProfileStore(errorSelector)
export const useProfileActions = () => useProfileStore(useShallow(actionsSelector))

// Computed selectors with useShallow for stability
export const useProfileFullName = () => useProfileStore(useShallow(profileFullNameSelector))
export const useProfileDepartment = () => useProfileStore(useShallow(profileDepartmentSelector))
export const useProfileRole = () => useProfileStore(useShallow(profileRoleSelector))
export const useProfileEmail = () => useProfileStore(useShallow(profileEmailSelector))

// Staleness check with memoized selector factory
export const createStaleSelector = (staleTimeMs: number) => 
  (state: ReturnType<typeof useProfileStore.getState>) => {
    if (!state.lastFetched) return true
    return Date.now() - state.lastFetched > staleTimeMs
  }

// Memoized stale selectors to prevent recreation
const staleSelectors = new Map<number, (state: ReturnType<typeof useProfileStore.getState>) => boolean>()

export const useIsProfileStale = (staleTimeMs: number = 5 * 60 * 1000) => {
  // Get or create stable selector reference
  if (!staleSelectors.has(staleTimeMs)) {
    staleSelectors.set(staleTimeMs, createStaleSelector(staleTimeMs))
  }
  const staleSelector = staleSelectors.get(staleTimeMs)!
  return useProfileStore(useShallow(staleSelector))
}

// Type exports for external usage
export type { ProfileState, ProfileActions }
