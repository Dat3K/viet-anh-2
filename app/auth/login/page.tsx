'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { AlertCircle, ArrowRight, Grid2X2, Lock } from 'lucide-react'
import { LoaderCircle } from '@/components/animate-ui/icons/loader-circle'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isLoading, error } = useAuth()
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => {
        setShowError(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSignIn = async () => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set a new timeout for debounce (400ms)
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await signIn()
        
        if (response.success) {
          // Redirect to dashboard after successful sign in
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Sign in error:', err)
      }
    }, 400);
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg transition-transform hover:scale-105">
            <img
              src="https://wbfbugqjkzczthqjvnwd.supabase.co/storage/v1/object/public/image/logo.png"
              alt="Company Logo"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
        </div>
        
        <Card className="w-full shadow-xl border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Đăng nhập vào Hệ Thống Quản Lý Yêu Cầu Trường Học
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-4">
            {showError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm transition-all duration-30 ease-in-out">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <div>
              <Button
                className="w-full py-6 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={handleSignIn}
                disabled={isLoading}
                size="lg"
              >
                <div className="flex items-center justify-center w-full">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-5 w-5" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <div className="bg-white dark:bg-gray-800 p-1 rounded mr-3">
                        <Grid2X2 className="h-5 w-5 text-[#0078D4]" />
                      </div>
                      <span>Đăng nhập với Microsoft</span>
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center">
                <Lock className="mr-2 h-4 w-4" />
                <span>Sử dụng tài khoản Azure AD của bạn để đăng nhập</span>
              </div>
            </div>
            
            <div className="text-center text-xs text-muted-foreground/70">
              <p>
                Bằng việc đăng nhập, bạn đồng ý với
                <a href="#" className="text-primary hover:underline mx-1">Điều khoản sử dụng</a>
                và
                <a href="#" className="text-primary hover:underline mx-1">Chính sách bảo mật</a>
              </p>
            </div>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2025 Trường Học Việt Anh. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </div>
  )
}