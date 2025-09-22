'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, CheckCircle } from 'lucide-react'

// Separate component that uses useSearchParams
function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [showLogoutMessage, setShowLogoutMessage] = useState(false)
  const { signInWithAzure } = useAuth()
  const searchParams = useSearchParams()

  // Check for logout parameter
  useEffect(() => {
    const isLogout = searchParams.get('logout') === 'true'
    if (isLogout) {
      setShowLogoutMessage(true)
      
      // Auto-hide message after 5 seconds
      const timer = setTimeout(() => {
        setShowLogoutMessage(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const handleAzureLogin = async () => {
    try {
      setIsLoading(true)
      await signInWithAzure()
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Logout success message */}
      {showLogoutMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            Đăng xuất thành công! Vui lòng đăng nhập lại.
          </span>
        </div>
      )}

      <Button
        onClick={handleAzureLogin}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"
              />
            </svg>
            Đăng nhập với Microsoft Azure
          </>
        )}
      </Button>
      
      <div className="text-center text-sm text-muted-foreground">
        Chỉ có thể đăng nhập bằng tài khoản Azure được ủy quyền
      </div>
    </div>
  )
}

// Loading fallback component
function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <Button
        disabled
        className="w-full"
        size="lg"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải...
      </Button>
      
      <div className="text-center text-sm text-muted-foreground">
        Chỉ có thể đăng nhập bằng tài khoản Azure được ủy quyền
      </div>
    </div>
  )
}

// Main export component with Suspense boundary
export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginFormContent />
    </Suspense>
  )
}
