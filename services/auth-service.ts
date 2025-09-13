import { createClient } from '@/lib/supabase/client'
import { AuthError, User, Session } from '@supabase/supabase-js'

export interface AuthResponse {
  success: boolean
  data?: User
  error?: string
}

export class AuthService {
  /**
   * Sign in with Azure AD using Supabase Auth
   */
  async signInWithAzureAD(): Promise<AuthResponse> {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid email profile offline_access',
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Redirect happens automatically through Supabase
      // The data object contains provider and url, not user directly
      return {
        success: true,
        data: undefined, // User will be handled by the OAuth redirect flow
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign in ' + (error as AuthError).message,
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign out ' + (error as AuthError).message,
      }
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (!user) {
        return {
          success: false,
          error: 'No user is currently authenticated',
        }
      }

      return {
        success: true,
        data: user,
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred while fetching user data ' + (error as AuthError).message,
      }
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}

// Export singleton instance
export const authService = new AuthService()