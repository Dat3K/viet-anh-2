'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { Icons } from '@/components/ui/icons'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isLoading, error } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      const response = await signIn()
      
      if (response.success) {
        // Redirect to dashboard after successful sign in
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Sign in error:', err)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng Nhập</CardTitle>
          <CardDescription>
            Đăng nhập vào Hệ Thống Quản Lý Yêu Cầu Trường Học
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleSignIn}
              disabled={isSigningIn || isLoading}
            >
              {isSigningIn || isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <Icons.microsoft className="mr-2 h-4 w-4" />
                  Đăng nhập với Microsoft
                </>
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Sử dụng tài khoản Azure AD của bạn để đăng nhập
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}