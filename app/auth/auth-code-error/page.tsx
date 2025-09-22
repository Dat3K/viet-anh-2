'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Component that uses useSearchParams
function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'exchange_failed':
        return 'Không thể xác thực với Azure. Vui lòng thử lại.'
      case 'no_user_data':
        return 'Không nhận được thông tin người dùng từ Azure.'
      case 'missing_code':
        return 'Thiếu mã xác thực từ Azure.'
      case 'unexpected_error':
        return 'Có lỗi không mong muốn xảy ra trong quá trình đăng nhập.'
      case 'access_denied':
        return 'Bạn đã từ chối cấp quyền truy cập hoặc không có quyền sử dụng hệ thống.'
      default:
        return 'Có lỗi xảy ra trong quá trình xác thực với Azure.'
    }
  }

  const getTechnicalDetails = () => {
    if (!error && !errorDescription) return null
    
    return (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            {error && (
              <div>
                <strong>Mã lỗi:</strong> {error}
              </div>
            )}
            {errorDescription && (
              <div>
                <strong>Chi tiết:</strong> {errorDescription}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const getSolution = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'Liên hệ với quản trị viên để được cấp quyền truy cập hệ thống.'
      case 'exchange_failed':
      case 'no_user_data':
      case 'unexpected_error':
        return 'Thử đăng nhập lại. Nếu vấn đề vẫn tiếp tục, liên hệ với bộ phận IT.'
      default:
        return 'Vui lòng thử lại hoặc liên hệ với quản trị viên hệ thống nếu vấn đề vẫn tiếp tục.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Hệ Thống Quản Lý
          </h1>
          <p className="text-muted-foreground">
            Trường Trung Tiểu Học Việt Anh
          </p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-center text-red-600">
              Lỗi Đăng Nhập
            </CardTitle>
            <CardDescription className="text-center">
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>{getSolution(error)}</p>
            </div>

            {getTechnicalDetails()}
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử Đăng Nhập Lại
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Về Trang Chủ
                </Link>
              </Button>
            </div>

            {/* Contact info for persistent issues */}
            {(error === 'exchange_failed' || error === 'unexpected_error') && (
              <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                <p>Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ:</p>
                <p className="font-medium">Bộ phận IT - Trường Việt Anh</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading fallback component
function AuthCodeErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Hệ Thống Quản Lý
          </h1>
          <p className="text-muted-foreground">
            Trường Trung Tiểu Học Việt Anh
          </p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            </div>
            <CardTitle className="text-2xl text-center">
              Đang tải...
            </CardTitle>
            <CardDescription className="text-center">
              Đang xử lý thông tin lỗi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử Đăng Nhập Lại
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Về Trang Chủ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main export component with Suspense boundary
export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<AuthCodeErrorFallback />}>
      <AuthCodeErrorContent />
    </Suspense>
  )
}
