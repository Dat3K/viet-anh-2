'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth-query'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string | string[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, hasRole, hasAnyRole } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
    
    // Check role requirements if specified
    if (!isLoading && isAuthenticated && requiredRole) {
      const hasRequiredRole = Array.isArray(requiredRole) 
        ? hasAnyRole(requiredRole) 
        : hasRole(requiredRole)
      
      if (!hasRequiredRole) {
        router.push('/unauthorized')
      }
    }
  }, [isLoading, isAuthenticated, user, router, requiredRole, hasRole, hasAnyRole, redirectTo])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Đang xác thực...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unauthorized message if user doesn't have required role
  if (!isLoading && isAuthenticated && requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? hasAnyRole(requiredRole) 
      : hasRole(requiredRole)
    
    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h2 className="text-xl font-bold mb-2">Truy cập bị từ chối</h2>
              <p className="text-muted-foreground">
                Bạn không có quyền truy cập vào trang này.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Render children if user is authenticated and has required permissions
  if (!isLoading && isAuthenticated) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}