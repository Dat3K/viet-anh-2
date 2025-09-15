'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithAzure } = useAuth()

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
