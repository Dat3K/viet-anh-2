import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient, PostgrestResponse } from '@supabase/supabase-js'

/**
 * Base service class providing common Supabase functionality
 * All other services should extend this class
 */
export abstract class BaseService {
  protected supabase: SupabaseClient
  private static clientInstance: SupabaseClient | null = null

  constructor() {
    // Use singleton pattern for better performance
    if (!BaseService.clientInstance) {
      BaseService.clientInstance = createClient()
    }
    this.supabase = BaseService.clientInstance
  }

  /**
   * Get current authenticated user
   */
  protected async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('User not authenticated')
    return user
  }

  /**
   * Get current user's profile with role information
   */
  protected async getCurrentUserProfile() {
    const user = await this.getCurrentUser()
    
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select(`
        *,
        roles(
          id,
          name,
          department_id
        )
      `)
      .eq('id', user.id)
      .single()

    if (error) throw error
    return profile
  }

  /**
   * Get current user's role ID
   */
  protected async getCurrentUserRoleId(): Promise<string> {
    const profile = await this.getCurrentUserProfile()
    return profile.role_id || ''
  }

  /**
   * Handle database errors with consistent error messages
   * Following Supabase best practice of returning errors instead of throwing
   */
  protected handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error)
    
    // Enhanced error information for debugging
    const enhancedError = {
      ...error,
      context,
      timestamp: new Date().toISOString(),
      code: error?.code || 'UNKNOWN_ERROR',
      details: error?.details || error?.message || 'Unknown error occurred'
    }
    
    throw enhancedError
  }


  /**
   * Create a standardized timestamp
   */
  protected getCurrentTimestamp(): string {
    return new Date().toISOString()
  }
}
