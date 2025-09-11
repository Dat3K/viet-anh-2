'use client'

import { useEffect } from 'react'
import { QueryProvider } from './query-provider'
import { useAuthStore } from '@/lib/auth/store'

interface AppProvidersProps {
  children: React.ReactNode
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore()

  useEffect(() => {
    // Initialize authentication state on app mount
    initialize()
  }, [initialize])

  return <>{children}</>
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </QueryProvider>
  )
}