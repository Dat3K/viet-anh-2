'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Icons } from '@/components/ui/icons'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { isLoading } = useAuth()

  useEffect(() => {
    // The Supabase client automatically handles the OAuth callback
    // and updates the auth state. We just need to redirect to the dashboard.
    if (!isLoading) {
      router.push('/dashboard')
    }
  }, [isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="text-center">
        <Icons.spinner className="mx-auto h-8 w-8 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Đang xác thực...</h2>
        <p className="mt-2 text-muted-foreground">
          Vui lòng đợi trong khi chúng tôi xác thực thông tin của bạn
        </p>
      </div>
    </div>
  )
}