import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AuthState } from './utils'
import { getCurrentUser, getCurrentSession, signOut } from './utils'
import { Session } from '@supabase/supabase-js'
import { Profile } from '@/types/database'

interface AuthStore extends AuthState {
  // Actions
  setProfile: (profile: Profile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  reset: () => void
  initialize: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const initialState: AuthState = {
  profile: null,
  session: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Actions
        setProfile: (profile) => set({ profile }, false, 'setProfile'),
        setSession: (session) => set({ session }, false, 'setSession'),
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
        setError: (error) => set({ error }, false, 'setError'),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }, false, 'setAuthenticated'),

        reset: () => set(initialState, false, 'reset'),

        initialize: async () => {
          try {
            set({ isLoading: true, error: null }, false, 'initializeStart')

            const [session, user] = await Promise.all([
              getCurrentSession(),
              getCurrentUser(),
            ])

            set(
              {
                session,
                profile: user,
                isAuthenticated: !!session && !!user,
                isLoading: false,
                error: null,
              },
              false,
              'initializeSuccess'
            )
          } catch (error) {
            console.error('Error initializing auth store:', error)
            set(
              {
                session: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to initialize authentication',
              },
              false,
              'initializeError'
            )
          }
        },

        logout: async () => {
          try {
            set({ isLoading: true, error: null }, false, 'logoutStart')

            await signOut()

            set(
              {
                session: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              },
              false,
              'logoutSuccess'
            )
          } catch (error) {
            console.error('Error logging out:', error)
            set(
              {
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to logout',
              },
              false,
              'logoutError'
            )
          }
        },

        refreshUser: async () => {
          try {
            set({ isLoading: true, error: null }, false, 'refreshUserStart')

            const user = await getCurrentUser()
            const session = await getCurrentSession()

            set(
              {
                profile: user,
                session,
                isAuthenticated: !!session && !!user,
                isLoading: false,
                error: null,
              },
              false,
              'refreshUserSuccess'
            )
          } catch (error) {
            console.error('Error refreshing user:', error)
            set(
              {
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to refresh user',
              },
              false,
              'refreshUserError'
            )
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.profile,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)

// Selectors
export const selectUser = (state: AuthStore) => state.profile
export const selectSession = (state: AuthStore) => state.session
export const selectIsLoading = (state: AuthStore) => state.isLoading
export const selectError = (state: AuthStore) => state.error
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectAuthActions = (state: AuthStore) => ({
  setProfile: state.setProfile,
  setSession: state.setSession,
  setLoading: state.setLoading,
  setError: state.setError,
  setAuthenticated: state.setAuthenticated,
  reset: state.reset,
  initialize: state.initialize,
  logout: state.logout,
  refreshUser: state.refreshUser,
})