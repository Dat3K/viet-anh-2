import { createClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { Profile } from '@/types/database'

export interface AuthState {
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

export async function signInWithAzure() {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to initiate login')
    }

    const data = await response.json()

    // Redirect to the OAuth URL
    if (data.url) {
      window.location.href = data.url
    }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to sign out')
    }

    // Redirect to home page
    window.location.href = '/'
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = createClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Fetch user profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getCurrentSession() {
  const supabase = createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return session
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

export async function syncUserProfile(user: User): Promise<Profile | null> {
  const supabase = createClient()

  try {
    // Extract user information from Azure AD
    const { error } = await supabase.rpc('sync_user_profile', {
      user_full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      user_phone: user.user_metadata?.phone ?? null,
      user_employee_code: user.user_metadata?.employee_code ?? null,
      user_department_id: user.user_metadata?.department_id ?? null,
      user_position_id: user.user_metadata?.position_id ?? null,
    })

    if (error) {
      console.error('Error syncing user profile:', error)
      return null
    }

    // Fetch the updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching synced profile:', profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error syncing user profile:', error)
    return null
  }
}

export function isUserAuthenticated(state: AuthState): boolean {
  return state.isAuthenticated && state.profile !== null
}

export function hasRole(state: AuthState, requiredRole: string): boolean {
  if (!isUserAuthenticated(state)) {
    return false
  }
  return state.profile?.role === requiredRole
}

export function hasAnyRole(state: AuthState, requiredRoles: string[]): boolean {
  if (!isUserAuthenticated(state)) {
    return false
  }
  return state.profile?.role ? requiredRoles.includes(state.profile.role) : false
}

export function isActiveUser(state: AuthState): boolean {
  if (!isUserAuthenticated(state)) {
    return false
  }
  return state.profile?.is_active ?? false
}

export function canAccessAdmin(state: AuthState): boolean {
  return isUserAuthenticated(state) && hasRole(state, 'admin') && isActiveUser(state)
}

export function canAccessDashboard(state: AuthState): boolean {
  return isUserAuthenticated(state) && isActiveUser(state)
}

export function formatUserName(profile: Profile | null): string {
  if (!profile) return ''
  return profile.full_name || profile.email
}

export function getUserInitials(profile: Profile | null): string {
  if (!profile || !profile.full_name) return ''

  const names = profile.full_name.split(' ')
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase()
  }

  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
}