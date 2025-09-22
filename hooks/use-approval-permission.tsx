'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

/**
 * Hook để check user có quyền approve không
 * Sử dụng step-by-step query approach để tránh lỗi join complex
 */
export function useApprovalPermission() {
  const { user, isAuthenticated } = useAuth()

  const { data: canApprove, isLoading } = useQuery({
    queryKey: ['approval-permission', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) {
        console.log('User not authenticated or no user ID')
        return false
      }

      try {
        // Step 1: Get user profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, is_active, role_id')
          .eq('id', user.id)
          .eq('is_active', true)
          .single()
        
        if (profileError) {
          console.error('Profile query error:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          })
          return false
        }
        
        if (!profile?.role_id) {
          console.log('User has no role assigned')
          return false
        }

        // Step 2: Get role information
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('id, name, can_approve, is_active')
          .eq('id', profile.role_id)
          .eq('is_active', true)
          .single()
        
        if (roleError) {
          console.error('Role query error:', {
            code: roleError.code,
            message: roleError.message,
            details: roleError.details,
            hint: roleError.hint
          })
          return false
        }
        
        const hasApprovalPermission = !!role?.can_approve
        console.log('Approval permission check result:', {
          userId: user.id,
          roleName: role?.name,
          canApprove: hasApprovalPermission
        })
        
        return hasApprovalPermission
      } catch (error) {
        console.error('Unexpected error in approval permission check:', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          userId: user?.id
        })
        return false
      }
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache 5 minutes  
    retry: (failureCount, error) => {
      // Only retry on network errors, not on data structure errors
      console.log('Query retry attempt:', failureCount, error)
      return failureCount < 2
    },
  })

  return {
    canApprove: canApprove || false,
    isLoading: isLoading || !isAuthenticated,
  }
}
